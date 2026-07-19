import asyncio
import re
import logging
import signal
import sys
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.tl.types import (
    MessageMediaPhoto,
    MessageMediaDocument,
    MessageEntityTextUrl,
    MessageEntityUrl,
    MessageEntityMention,
    MessageEntityCustomEmoji,
    MessageEntityBold,
    MessageEntityItalic,
    MessageEntityCode,
    MessageEntityPre,
    MessageEntityUnderline,
    MessageEntityStrike,
    MessageEntitySpoiler,
    MessageEntityBlockquote,
)
from telethon.errors import (
    FloodWaitError,
    ChatWriteForbiddenError,
    AuthKeyUnregisteredError,
    UserDeactivatedBanError,
    RPCError
)
import config
import database as db

# Telethon'un gereksiz loglarını ÖNCE kapat (Got difference for channel X updates vs.)
# Telethon'un gereksiz loglarını ÖNCE kapat
logging.getLogger('telethon').setLevel(logging.ERROR)
logging.getLogger('telethon.client.updates').setLevel(logging.ERROR)
logging.getLogger('telethon.network.mtprotosender').setLevel(logging.ERROR)
logging.getLogger('telethon.extensions.messagepacker').setLevel(logging.ERROR)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global flags
shutdown_flag = False
client = None

# Telegram message link pattern
TELEGRAM_LINK_PATTERN = re.compile(
    r'(?:https?://)?(?:t\.me|telegram\.me)/(?:c/)?(\d+|[a-zA-Z][a-zA-Z0-9_]*)/(\d+)'
)


def utf16_len(text: str) -> int:
    """
    Telethon UTF-16 code unit uzunluğunu hesapla.
    Türkçe ve özel karakterler için gerekli.
    """
    if not text:
        return 0
    return len(text.encode('utf-16-le')) // 2


def utf16_slice(text: str, start: int, end: int) -> str:
    """UTF-16 code unit offset'leriyle metinden parça al (Telethon entity offset'leri için)."""
    if not text:
        return ""
    b = text.encode('utf-16-le')
    return b[start * 2:end * 2].decode('utf-16-le', errors='ignore')

# Link entity tipleri (silinecek)
LINK_ENTITY_TYPES = (MessageEntityTextUrl, MessageEntityUrl, MessageEntityMention)

# Formatting entity tipleri (korunacak)
FORMATTING_ENTITY_TYPES = (
    MessageEntityBold, MessageEntityItalic, MessageEntityCode,
    MessageEntityPre, MessageEntityUnderline, MessageEntityStrike,
    MessageEntitySpoiler, MessageEntityCustomEmoji, MessageEntityBlockquote
)


def create_client():
    """Create Telegram client with StringSession"""
    if not config.SESSION_STRING:
        logger.error("SESSION_STRING is required!")
        sys.exit(1)

    session = StringSession(config.SESSION_STRING)

    return TelegramClient(
        session,
        config.API_ID,
        config.API_HASH,
        connection_retries=5,
        retry_delay=1,
        auto_reconnect=True
    )


def _link_should_be_kept(entity, raw_text: str, keep_words: list) -> bool:
    """
    Bir link entity'sinin korunup korunmayacağını kontrol et.
    Link URL'inde veya görünen metninde keep_words'ten biri varsa True döner (silinmez).
    """
    if not keep_words:
        return False

    # URL (MessageEntityTextUrl) veya görünen metin (MessageEntityUrl/Mention)
    link_url = getattr(entity, 'url', '') or ''
    visible_text = utf16_slice(raw_text, entity.offset, entity.offset + entity.length)
    haystack = f"{link_url} {visible_text}".lower()

    matched = any(kw in haystack for kw in keep_words)
    if matched:
        logger.info(f"Link KORUNDU: url={link_url!r} text={visible_text!r} kw={keep_words}")
    else:
        logger.info(f"Link SILINECEK: url={link_url!r} text={visible_text!r} kw={keep_words}")
    return matched


def remove_links_from_message(raw_text: str, entities: list, keep_link_keywords: str = '') -> tuple:
    """
    Mesajdan link entity'lerini içeren SATIRLARI tamamen kaldır.
    Formatting entity'lerini (bold, italic, CUSTOM EMOJI vb.) bozulmadan korur.

    Bu sürüm, entity offset'lerini UTF-16 "silinen aralık" maskesiyle yeniden eşler.
    Böylece link silindikten sonra premium (custom) emoji'ler statik emoji'ye DÖNMEZ.

    NOT: Telethon entity offset/length değerleri UTF-16 code units cinsindendir.

    Args:
        raw_text: Mesajın düz metni (message.raw_text)
        entities: Mesajın entity listesi
        keep_link_keywords: Virgülle ayrılmış kelimeler. Linkte bunlardan biri
                            geçiyorsa o link (ve satırı) SİLİNMEZ.

    Returns:
        (temizlenmiş_metin, güncellenmiş_entity_listesi)
    """
    if not raw_text:
        return "", []

    entities = entities or []

    # Entity'leri kategorize et
    link_entities = [e for e in entities if isinstance(e, LINK_ENTITY_TYPES)]
    formatting_entities = [e for e in entities if isinstance(e, FORMATTING_ENTITY_TYPES)]

    # Link yoksa orijinali aynen döndür
    if not link_entities:
        return raw_text, list(formatting_entities)

    # "Silme" istisnası kelimeleri
    keep_words = [w.strip().lower() for w in (keep_link_keywords or '').split(',') if w.strip()]

    # Satırları ve her satırın UTF-16 başlangıç/bitiş pozisyonlarını hesapla
    lines = raw_text.split('\n')
    line_spans = []  # (start_utf16, end_utf16) -> end newline HARİÇ
    pos = 0
    for line in lines:
        line_len = utf16_len(line)
        line_spans.append((pos, pos + line_len))
        pos += line_len + 1  # +1 newline

    # Hangi satırlar silinecek? (keep_words içeren linkler hariç)
    lines_to_remove = set()
    kept_link_entities = []  # Korunan link entity'leri (formatting olarak taşınacak)
    for entity in link_entities:
        if _link_should_be_kept(entity, raw_text, keep_words):
            kept_link_entities.append(entity)
            continue  # Bu linki koru -> satırı silme
        link_start = entity.offset
        link_end = entity.offset + entity.length
        for line_idx, (ls, le) in enumerate(line_spans):
            if link_start <= le and link_end >= ls:
                lines_to_remove.add(line_idx)

    # Silinecek satır yoksa (hepsi korunduysa) orijinali döndür
    if not lines_to_remove:
        return raw_text, list(formatting_entities) + kept_link_entities

    # Silinecek UTF-16 aralıkları (satır metni + sonundaki newline)
    removed_ranges = []
    last_idx = len(lines) - 1
    for idx in lines_to_remove:
        ls, le = line_spans[idx]
        end = le + 1 if idx < last_idx else le  # son satır değilse newline'ı da sil
        removed_ranges.append((ls, end))
    removed_ranges.sort()

    # Yeni metni oluştur
    cleaned_text = '\n'.join(line for i, line in enumerate(lines) if i not in lines_to_remove)

    # Bir UTF-16 offset'inin yeni karşılığını hesapla (öncesinde silinen unit sayısını çıkar)
    def shift(offset: int) -> int:
        removed_before = 0
        for rs, re_ in removed_ranges:
            if re_ <= offset:
                removed_before += (re_ - rs)
            elif rs < offset < re_:
                removed_before += (offset - rs)
        return offset - removed_before

    # Formatting entity'lerini yeniden eşle (custom emoji dahil tüm alanları KORU)
    # Korunan link entity'leri de formatting listesine dahil et
    all_formatting = list(formatting_entities) + kept_link_entities
    updated_formatting = []
    for entity in all_formatting:
        new_start = shift(entity.offset)
        new_end = shift(entity.offset + entity.length)
        new_len = new_end - new_start

        # Entity tamamen silindiyse (ör. link satırındaki bold) atla
        if new_len <= 0:
            continue

        try:
            extra = {k: v for k, v in entity.__dict__.items() if k not in ('offset', 'length')}
            updated_formatting.append(type(entity)(offset=new_start, length=new_len, **extra))
        except Exception:
            pass

    return cleaned_text, updated_formatting


def append_link_to_text(text: str, link: str, link_text: str = None) -> tuple:
    """
    Metnin sonuna link ekle.
    Eğer link_text verilmişse, Telegram'daki gibi metin üzerine link oluşturur.

    Args:
        text: Orijinal metin
        link: Eklenecek URL
        link_text: Link'in görünür metni (opsiyonel)

    Returns:
        (güncellenmiş_metin, ek_entity_listesi)
    """
    if not link:
        return text, []

    # Link metni varsa, metin olarak göster ve entity ekle
    if link_text and link_text.strip():
        display_text = link_text.strip()
    else:
        # Link metni yoksa, URL'yi doğrudan göster
        display_text = link

    if text:
        new_text = f"{text}\n\n{display_text}"
        # Link entity'si için offset hesapla (UTF-16 code units!)
        # Türkçe karakterler için utf16_len kullanmalıyız
        link_offset = utf16_len(text) + 2  # +2 for \n\n
    else:
        new_text = display_text
        link_offset = 0

    # Eğer link metni varsa, MessageEntityTextUrl oluştur
    entities = []
    if link_text and link_text.strip():
        # MessageEntityTextUrl entity'si oluştur
        # Length de UTF-16 code units olmalı!
        entity = MessageEntityTextUrl(
            offset=link_offset,
            length=utf16_len(display_text),
            url=link
        )
        entities.append(entity)

    return new_text, entities


async def parse_telegram_link(link: str) -> tuple:
    """Telegram mesaj linkini parse et ve (chat_id, message_id) döndür"""
    match = TELEGRAM_LINK_PATTERN.search(link)
    if not match:
        return None, None

    chat_identifier = match.group(1)
    message_id = int(match.group(2))

    if chat_identifier.isdigit():
        chat_id = int(f"-100{chat_identifier}")
    else:
        chat_id = chat_identifier

    return chat_id, message_id


def check_trigger_keywords(text: str, keywords_str: str) -> bool:
    """Mesajda trigger keyword var mı kontrol et"""
    if not keywords_str or not keywords_str.strip():
        return True

    if not text:
        return False

    text_lower = text.lower()
    keywords = [kw.strip().lower() for kw in keywords_str.split(',') if kw.strip()]

    if not keywords:
        return True

    for keyword in keywords:
        if keyword in text_lower:
            return True

    return False


def rule_matches(match_text: str, match_keywords: str) -> bool:
    """
    Kural eşleşiyor mu?
    match_keywords boşsa her içerikle eşleşir (catch-all / genel kural).
    Doluysa, match_text içinde kelimelerden en az biri geçmeli.
    """
    if not match_keywords or not match_keywords.strip():
        return True
    if not match_text:
        return False
    text_lower = match_text.lower()
    keywords = [k.strip().lower() for k in match_keywords.split(',') if k.strip()]
    if not keywords:
        return True
    return any(k in text_lower for k in keywords)


def _config_from_rule(source_channel: dict, rule: dict, target: dict) -> dict:
    """Bir kural (paylaşım) + hedef kanaldan forward_message için config üret."""
    return {
        'id': source_channel['id'],
        'target_chat_id': target['chat_id'],
        'target_title': target.get('title'),
        'append_link': rule.get('append_link', '') or '',
        'append_link_text': rule.get('append_link_text', '') or '',
        'remove_links': rule.get('remove_links', True),
        'keep_link_keywords': rule.get('keep_link_keywords', '') or '',
        'trigger_keywords': '',  # filtreleme kural eşleşmesiyle yapıldı
        # 'link geri gönder' kaynak (dinleme kanalı) seviyesinde tutulur
        'send_link_back': source_channel.get('send_link_back', False),
    }


def _config_from_source(source_channel: dict) -> dict:
    """Kural yokken kaynağın kendi (varsayılan) ayarlarından config üret."""
    return {
        'id': source_channel['id'],
        'target_chat_id': source_channel['target_chat_id'],
        'target_title': source_channel.get('target_title'),
        'append_link': source_channel.get('append_link', '') or '',
        'append_link_text': source_channel.get('append_link_text', '') or '',
        'remove_links': source_channel.get('remove_links', True),
        'keep_link_keywords': source_channel.get('keep_link_keywords', '') or '',
        'trigger_keywords': source_channel.get('trigger_keywords', '') or '',
        'send_link_back': source_channel.get('send_link_back', False),
    }


async def build_configs_for_message(source_channel: dict, match_text: str) -> list:
    """
    Gelen içerik için gönderilecek hedef config listesini üret.

    - Kaynağa tanımlı aktif kural varsa: öncelik sırasıyla EŞLEŞEN İLK kural seçilir
      ve o kuralın TÜM hedeflerine (çoklu hedef) gönderilir.
      Hiçbir kural eşleşmezse boş liste döner (gönderilmez).
    - Kural yoksa: kaynağın varsayılan tek hedefine gönderilir (eski davranış).
    """
    try:
        rules = await db.get_active_rules_for_source(source_channel['id'])
    except Exception as e:
        logger.warning(f"Kurallar alınamadı, varsayılana dönülüyor: {e}")
        rules = []

    if rules:
        matched = None
        for rule in rules:
            if rule_matches(match_text, rule.get('match_keywords', '')):
                matched = rule
                break

        if not matched:
            logger.info("⏭️ Hiçbir kural eşleşmedi, atlanıyor")
            return []

        target_ids = matched.get('target_channel_ids') or []
        targets = await db.get_target_channels_by_ids(list(target_ids))
        if not targets:
            logger.warning(f"⚠️ Kuralın hedefi yok: {matched.get('name') or matched['id']}")
            return []

        rule_label = matched.get('name') or f"#{matched['id']}"
        logger.info(f"🎯 Kural eşleşti: '{rule_label}' -> {len(targets)} hedef")
        return [_config_from_rule(source_channel, matched, t) for t in targets]

    # Kural yok -> eski tekil davranış
    if not source_channel.get('target_chat_id'):
        return []
    return [_config_from_source(source_channel)]


async def send_feedback_message(event, source_channel_id: int, results: list):
    """
    Paylaşım sonrası kaynağa TEK bir özet ('Paylaşıldı') mesajı gönder.
    Çoklu hedefte tüm grupların linkleri tek mesajda listelenir.

    results: [(hedef_etiket, hedef_link), ...]
    """
    global client
    if not results:
        return
    try:
        remaining = await db.get_remaining_posts_today(source_channel_id)

        if len(results) == 1:
            _, link = results[0]
            body = f"✅ Paylaşıldı!\n{link}"
        else:
            lines = "\n".join(f"• {label}: {link}" for label, link in results)
            body = f"✅ {len(results)} gruba paylaşıldı!\n{lines}"

        body += f"\n\n📊 Kalan Post Hakkınız: {remaining}"

        await client.send_message(
            event.chat_id,
            body,
            reply_to=event.message.id,
            link_preview=False
        )
    except Exception as e:
        logger.debug(f"Geri bildirim gönderilemedi: {e}")


async def forward_message(source_channel_config: dict, message):
    """
    Mesajı hedef kanala işleyerek gönder.
    Dönüş: (success: bool, target_link: str|None, target_label: str|None)
    Geri bildirim (link geri gönder) artık burada DEĞİL, dispatch katmanında
    tüm hedefler için TEK mesajda toplanır.
    """
    global client

    try:
        # target_chat_id'yi integer'a çevir (string olabilir)
        target_chat_id_raw = source_channel_config['target_chat_id']
        try:
            target_chat_id = int(target_chat_id_raw)
        except (ValueError, TypeError):
            target_chat_id = target_chat_id_raw  # String ise öyle kalsın (@username gibi)
        append_link = source_channel_config['append_link']
        append_link_text = source_channel_config.get('append_link_text', '')
        remove_links = source_channel_config['remove_links']
        keep_link_keywords = source_channel_config.get('keep_link_keywords', '') or ''
        trigger_keywords = source_channel_config.get('trigger_keywords', '')

        # Orijinal metin ve entity'leri al
        # ÖNEMLİ: raw_text kullan, text değil!
        original_text = message.raw_text or ''
        original_entities = list(message.entities) if message.entities else []

        # Media için caption - Telethon'da caption zaten raw_text içinde
        # Ayrıca entities de message.entities içinde (caption için de)

        # Trigger keywords kontrolü
        if not check_trigger_keywords(original_text, trigger_keywords):
            return (False, None, None)

        # Link kaldırma işlemi
        if remove_links:
            final_text, final_entities = remove_links_from_message(original_text, original_entities, keep_link_keywords)
        else:
            # Link kaldırma kapalı - orijinali kullan
            final_text = original_text
            final_entities = original_entities

        # Append link (link metni desteği ile)
        if append_link:
            final_text, link_entities = append_link_to_text(final_text, append_link, append_link_text)
            # Link entity'lerini mevcut entity'lere ekle
            if link_entities:
                final_entities = final_entities + link_entities

        # Media kontrolü
        has_media = message.media is not None
        media_type = None

        if has_media:
            if isinstance(message.media, MessageMediaPhoto):
                media_type = 'photo'
            elif isinstance(message.media, MessageMediaDocument):
                media_type = 'document'
            else:
                media_type = 'other'

        # Mesajı gönder
        # ÖNEMLİ: parse_mode=None ve formatting_entities kullan
        # Bu sayede metin olduğu gibi gönderilir, markdown parse edilmez

        if has_media:
            sent_message = await client.send_file(
                entity=target_chat_id,
                file=message.media,
                caption=final_text if final_text else None,
                formatting_entities=final_entities if final_entities else None,
                parse_mode=None  # Markdown/HTML parse YAPMA
            )
        else:
            sent_message = await client.send_message(
                entity=target_chat_id,
                message=final_text,
                formatting_entities=final_entities if final_entities else None,
                parse_mode=None,  # Markdown/HTML parse YAPMA
                link_preview=False
            )

        # Source link oluştur
        source_chat_id = message.chat_id
        try:
            source_entity = await client.get_entity(source_chat_id)
            source_username = getattr(source_entity, 'username', None)
            if source_username:
                source_link = f"t.me/{source_username}/{message.id}"
            elif str(source_chat_id).startswith('-100'):
                source_link = f"t.me/c/{str(source_chat_id)[4:]}/{message.id}"
            else:
                source_link = f"t.me/{source_chat_id}/{message.id}"
        except Exception:
            if str(source_chat_id).startswith('-100'):
                source_link = f"t.me/c/{str(source_chat_id)[4:]}/{message.id}"
            else:
                source_link = f"t.me/{source_chat_id}/{message.id}"

        # Target link oluştur
        target_link = None
        try:
            target_entity = await client.get_entity(target_chat_id)
            target_username = getattr(target_entity, 'username', None)
            if target_username:
                target_link = f"https://t.me/{target_username}/{sent_message.id}"
            else:
                # Private kanal: ID'den -100 veya - önekini temizle
                tid = str(target_chat_id)
                if tid.startswith('-100'):
                    clean_id = tid[4:]
                elif tid.startswith('-'):
                    clean_id = tid[1:]
                else:
                    clean_id = tid
                target_link = f"https://t.me/c/{clean_id}/{sent_message.id}"
        except Exception:
            tid = str(target_chat_id)
            if tid.startswith('-100'):
                clean_id = tid[4:]
            elif tid.startswith('-'):
                clean_id = tid[1:]
            else:
                clean_id = tid
            target_link = f"https://t.me/c/{clean_id}/{sent_message.id}"

        # Database'e kaydet
        await db.add_post(
            source_channel_id=source_channel_config['id'],
            source_link=source_link,
            source_chat_id=source_chat_id,
            source_message_id=message.id,
            target_chat_id=target_chat_id,
            target_message_id=sent_message.id,
            message_text=final_text[:500] if final_text else None,
            has_media=has_media,
            media_type=media_type,
            status='success'
        )

        target_label = source_channel_config.get('target_title') or str(target_chat_id)
        logger.info(f"✅ {message.id} -> {target_link}")
        return (True, target_link, target_label)

    except FloodWaitError as e:
        logger.warning(f"⏳ Flood wait: {e.seconds}s bekleniyor...")
        await asyncio.sleep(e.seconds)
        return (False, None, None)

    except ChatWriteForbiddenError:
        logger.error(f"❌ Hedefe yazılamıyor: {source_channel_config.get('target_title', target_chat_id)}")
        await db.add_post(
            source_channel_id=source_channel_config['id'],
            source_link=f"t.me/{message.chat_id}/{message.id}",
            source_chat_id=message.chat_id,
            source_message_id=message.id,
            target_chat_id=target_chat_id,
            target_message_id=0,
            status='failed',
            has_media=False
        )
        return (False, None, None)

    except RPCError as e:
        # Medya gönderme izni hatalarını yakala (403 CHAT_SEND_PHOTOS_FORBIDDEN, CHAT_SEND_MEDIA_FORBIDDEN vb.)
        if e.code == 403 and 'FORBIDDEN' in str(e.message).upper():
            logger.error(f"❌ Hedefe medya gönderilemedi (izin yok): {source_channel_config.get('target_title', target_chat_id)} - {e.message}")
            # Media olmadan sadece text olarak göndermeyi dene
            try:
                if final_text:
                    await client.send_message(
                        entity=target_chat_id,
                        message=final_text + "\n\n⚠️ (Medya gönderilemedi - izin yok)",
                        formatting_entities=final_entities if final_entities else None,
                        parse_mode=None,
                        link_preview=False
                    )
                    logger.info(f"📝 Medya yerine sadece metin gönderildi: {target_chat_id}")
            except Exception:
                pass
            await db.add_post(
                source_channel_id=source_channel_config['id'],
                source_link=f"t.me/{message.chat_id}/{message.id}",
                source_chat_id=message.chat_id,
                source_message_id=message.id,
                target_chat_id=target_chat_id,
                target_message_id=0,
                status='media_forbidden',
                has_media=True
            )
            return (False, None, None)
        else:
            logger.error(f"❌ RPC hatası: {e}")
            return (False, None, None)

    except Exception as e:
        logger.error(f"❌ Forward hatası: {e}")
        return (False, None, None)


async def handle_telegram_link(event, link: str):
    """Telegram mesaj linkini işle - mesajı al ve forward et"""
    global client

    try:
        chat_id, message_id = await parse_telegram_link(link)

        if not chat_id or not message_id:
            logger.warning(f"❌ Link parse edilemedi: {link}")
            return

        try:
            if isinstance(chat_id, str):
                entity = await client.get_entity(chat_id)
                message = await client.get_messages(entity, ids=message_id)
            else:
                message = await client.get_messages(chat_id, ids=message_id)
        except Exception as e:
            logger.warning(f"❌ Mesaj alınamadı ({link}): {e}")
            return

        if not message:
            logger.warning(f"❌ Mesaj bulunamadı: {link}")
            return

        source_channel = await db.get_source_channel(event.chat_id)

        if not source_channel:
            logger.debug(f"⏭️ Kayıtlı kaynak kanal değil: {event.chat_id}")
            return

        can_post = await db.can_post_today(source_channel['id'])
        if not can_post:
            logger.info(f"⚠️ Günlük limit doldu: {source_channel.get('source_title', event.chat_id)}")
            if source_channel.get('send_link_back', False):
                try:
                    await client.send_message(
                        event.chat_id,
                        "⚠️ Günlük post limitiniz doldu. Yarın tekrar deneyin.",
                        reply_to=event.message.id,
                        link_preview=False
                    )
                except Exception:
                    pass
            return

        # Kurallara göre hedef config listesini üret (eşleşme metni = link URL'i)
        configs = await build_configs_for_message(source_channel, link)
        if not configs:
            return

        logger.info(f"📤 Link işleniyor: {link} -> {len(configs)} hedef")
        results = []
        for cfg in configs:
            ok, tlink, tlabel = await forward_message(cfg, message)
            if ok and tlink:
                results.append((tlabel, tlink))

        # Link geri gönder açıksa: TÜM hedeflerin linkleri tek özet mesajda
        if results and configs[0].get('send_link_back'):
            await send_feedback_message(event, source_channel['id'], results)

    except Exception as e:
        logger.error(f"Link error: {e}")


async def setup_message_handler():
    """Mesaj handler'ını kur"""
    global client

    @client.on(events.NewMessage)
    async def message_handler(event):
        """Monitör edilen kanallardaki yeni mesajları işle"""
        try:
            if not await db.is_bot_enabled():
                return

            source_channel = await db.get_source_channel(event.chat_id)

            if not source_channel:
                # Kayıtlı olmayan kanalları loglama (spam olur)
                return

            source_title = source_channel.get('source_title', str(event.chat_id))
            message_text = event.message.raw_text or ''
            listen_type = source_channel.get('listen_type', 'direct')

            logger.info(f"📩 Mesaj alındı [{source_title}] mode={listen_type}")

            if listen_type == 'link':
                links = TELEGRAM_LINK_PATTERN.findall(message_text)

                if links:
                    logger.info(f"🔗 {len(links)} link bulundu")
                    for match in TELEGRAM_LINK_PATTERN.finditer(message_text):
                        full_link = match.group(0)
                        await handle_telegram_link(event, full_link)
                else:
                    logger.debug(f"⏭️ Link bulunamadı, atlanıyor")

            else:  # listen_type == 'direct'
                if message_text or event.message.media:
                    # Tetikleyici kelime kontrolü (kaynak kanal seviyesi)
                    trigger_keywords = source_channel.get('trigger_keywords', '') or ''
                    if not check_trigger_keywords(message_text, trigger_keywords):
                        logger.debug(f"⏭️ Tetikleyici kelime yok, atlanıyor: {source_title}")
                        return

                    can_post = await db.can_post_today(source_channel['id'])
                    if not can_post:
                        logger.info(f"⚠️ Günlük limit doldu: {source_title}")
                        if source_channel.get('send_link_back', False):
                            try:
                                await client.send_message(
                                    event.chat_id,
                                    "⚠️ Günlük post limitiniz doldu. Yarın tekrar deneyin.",
                                    reply_to=event.message.id,
                                    link_preview=False
                                )
                            except Exception:
                                pass
                        return

                    # Kurallara göre hedef config listesini üret (eşleşme metni = mesaj metni)
                    configs = await build_configs_for_message(source_channel, message_text)
                    if not configs:
                        return

                    logger.info(f"📤 Direkt mesaj iletiliyor: {source_title} -> {len(configs)} hedef")
                    results = []
                    for cfg in configs:
                        ok, tlink, tlabel = await forward_message(cfg, event.message)
                        if ok and tlink:
                            results.append((tlabel, tlink))

                    # Link geri gönder açıksa: TÜM hedeflerin linkleri tek özet mesajda
                    if results and configs[0].get('send_link_back'):
                        await send_feedback_message(event, source_channel['id'], results)

        except Exception as e:
            import traceback
            logger.error(f"Handler error: {e}\n{traceback.format_exc()}")


async def update_bot_status(status: str):
    """Bot durumunu database'de güncelle"""
    try:
        await db.set_setting('bot_status', status)
    except Exception:
        pass


async def heartbeat():
    """Periyodik heartbeat - bot durumunu güncelle"""
    global shutdown_flag

    while not shutdown_flag:
        try:
            await update_bot_status('online')
        except Exception:
            pass

        await asyncio.sleep(config.HEARTBEAT_INTERVAL)


async def graceful_shutdown(sig=None):
    """Graceful shutdown işle"""
    global shutdown_flag, client

    if shutdown_flag:
        return  # Zaten shutdown yapılıyor

    shutdown_flag = True
    logger.info("🛑 Shutdown başlatılıyor...")

    try:
        await update_bot_status('offline')
    except Exception:
        pass

    # Önce client'ı kapat
    if client and client.is_connected():
        try:
            await asyncio.wait_for(client.disconnect(), timeout=5.0)
        except asyncio.TimeoutError:
            logger.warning("Client disconnect timeout")
        except Exception:
            pass

    # Sonra database'i kapat
    try:
        await db.close_db()
    except Exception:
        pass

    # Pending task'ları temizle
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    logger.info("✅ Shutdown tamamlandı")


def setup_signal_handlers(loop):
    """Signal handler'ları kur"""
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(
                sig,
                lambda s=sig: asyncio.create_task(graceful_shutdown(s))
            )
        except NotImplementedError:
            signal.signal(sig, lambda s, f: asyncio.create_task(graceful_shutdown()))


async def start_client():
    """Telegram client'ı başlat"""
    global client

    await client.connect()

    if not await client.is_user_authorized():
        logger.error("Session expired! Run: python generate_session.py")
        raise AuthKeyUnregisteredError("Session expired or invalid")

    return client


async def main():
    """Ana fonksiyon"""
    global client, shutdown_flag

    if not config.API_ID or not config.API_HASH:
        logger.error("API_ID and API_HASH required!")
        sys.exit(1)

    if not config.DATABASE_URL:
        logger.error("DATABASE_URL required!")
        sys.exit(1)

    if not config.SESSION_STRING:
        logger.error("SESSION_STRING required!")
        sys.exit(1)

    try:
        await db.init_db()
    except Exception as e:
        logger.error(f"Database error: {e}")
        sys.exit(1)

    client = create_client()

    try:
        await start_client()
    except (AuthKeyUnregisteredError, UserDeactivatedBanError) as e:
        logger.error(f"Auth failed: {e}")
        await db.close_db()
        sys.exit(1)
    except Exception as e:
        logger.error(f"Client error: {e}")
        await db.close_db()
        sys.exit(1)

    try:
        me = await client.get_me()
        logger.info(f"✅ {me.first_name} (@{me.username or 'no username'}) - Bot running")
    except Exception:
        logger.info("✅ Bot running")

    await setup_message_handler()
    await update_bot_status('online')

    heartbeat_task = asyncio.create_task(heartbeat())

    try:
        await client.run_until_disconnected()
    except Exception as e:
        if not shutdown_flag:
            logger.error(f"Disconnected: {e}")

    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass


if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    setup_signal_handlers(loop)

    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        loop.run_until_complete(graceful_shutdown())
    except Exception as e:
        logger.error(f"Crashed: {e}")
        loop.run_until_complete(graceful_shutdown())
    finally:
        loop.close()
