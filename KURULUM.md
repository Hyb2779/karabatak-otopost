# HarleyOtoPost — Ubuntu Sunucu Kurulum Rehberi

> **Hedef:** Bu rehberin sonunda sitemiz `http://SUNUCU_IP:3000` adresinde, bot da arka planda Telegram mesajlarını izleyip yönlendirecek.

Tahmini süre: **15–20 dakika**.

---

## 📋 İçindekiler

1. [Ön hazırlık (5 dk)](#1-ön-hazırlık-5-dk)
2. [Neon PostgreSQL kurulumu (3 dk)](#2-neon-postgresql-kurulumu-3-dk)
3. [Telegram API bilgilerini alın (2 dk)](#3-telegram-api-bilgilerini-alın-2-dk)
4. [Sunucuya bağlanın ve projeyi yükleyin (3 dk)](#4-sunucuya-bağlanın-ve-projeyi-yükleyin-3-dk)
5. [Otomatik kurulum scriptini çalıştırın (5 dk)](#5-otomatik-kurulum-scriptini-çalıştırın-5-dk)
6. [.env dosyalarını doldurun (2 dk)](#6-env-dosyalarını-doldurun-2-dk)
7. [SESSION_STRING üretin (1 dk)](#7-session_string-üretin-1-dk)
8. [Servisleri başlatın (1 dk)](#8-servisleri-başlatın-1-dk)
9. [Siteye giriş yapın ve test edin](#9-siteye-giriş-yapın-ve-test-edin)
10. [Sorun giderme](#10-sorun-giderme)

---

## 1) Ön hazırlık (5 dk)

Bunlar elinizde olmalı:

- ✅ Bir Ubuntu sunucusu (20.04 / 22.04 / 24.04 fark etmez)
- ✅ Sunucuya SSH erişimi (`ssh kullanici@SUNUCU_IP`)
- ✅ `sudo` yetkili bir kullanıcı (`root` ise de olur ama önerilmez)
- ✅ Bot olarak kullanacağınız bir Telegram hesabı (telefon numarası ile)
- ✅ İnternete açık 3000 portu (firewall varsa)

**Firewall (UFW) açıksa 3000'i açmayı unutmayın:**

```bash
sudo ufw allow 3000/tcp
```

---

## 2) Neon PostgreSQL kurulumu (3 dk)

Hem site hem bot aynı PostgreSQL'i kullanacak. En kolay yol **ücretsiz Neon**:

1. https://neon.tech adresine gidin
2. Sağ üstten **Sign Up** → GitHub veya Google ile kayıt olun
3. Açılan sihirbazda:
   - **Project name:** `harleyotopost` (ne yazsanız fark etmez)
   - **Postgres version:** varsayılan (16) bırakın
   - **Cloud provider:** AWS
   - **Region:** `Europe (Frankfurt)` — sunucunuz Türkiye'ye yakınsa
4. **Create project** butonuna basın
5. Açılan ekranda **Connection string** kutusu görünür. Şuna benzer:

   ```
   postgresql://neondb_owner:Abc123xyz@ep-cool-haze-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

6. Sağdaki 📋 ikonuna tıklayıp **kopyalayın**. Bu adresi **iki yerde** kullanacağız.

> ⚠️ Parolayı (kopyalanan string'in içinde) bir yere not edin, çünkü Neon onu bir daha **net olarak göstermez**.

---

## 3) Telegram API bilgilerini alın (2 dk)

1. https://my.telegram.org adresine gidin
2. **Telefon numaranızla** giriş yapın (bot olarak kullanacağınız hesap)
3. Telegram'a gelen kodu girin
4. Ana sayfada **API development tools** linkine tıklayın
5. **App title:** `HarleyOtoPost`  **Short name:** `harleybot` yazın (önemli değil)
6. **Create application** butonuna basın
7. Açılan sayfada şunları göreceksiniz:

   ```
   App api_id:   12345678
   App api_hash: 0123456789abcdef0123456789abcdef
   ```

8. Her ikisini de bir yere kopyalayın.

> ⚠️ `api_hash`'i **kimseyle paylaşmayın**, hesabınız çalınabilir.

---

## 4) Sunucuya bağlanın ve projeyi yükleyin (3 dk)

### 4.a — SSH ile bağlanın

```bash
ssh kullanici@SUNUCU_IP
```

### 4.b — Projeyi yükleyin

**Yöntem 1 — SCP ile yerel zip'i atın** (önerilen):

Yerel bilgisayarınızda terminal açın:

```bash
scp harleyotopost-ready.zip kullanici@SUNUCU_IP:~/
```

Sonra sunucudaki terminale dönüp:

```bash
cd ~
unzip harleyotopost-ready.zip
cd harleyotopost
ls
```

`bot/`, `src/`, `setup.sh`, `KURULUM.md` gibi dosyaları görmelisiniz.

**Yöntem 2 — `wget` ile indirebileceğiniz bir yer varsa:**

```bash
cd ~
wget https://INDIRME_LINKINIZ/harleyotopost-ready.zip
unzip harleyotopost-ready.zip
cd harleyotopost
```

---

## 5) Otomatik kurulum scriptini çalıştırın (5 dk)

```bash
cd ~/harleyotopost
bash setup.sh
```

Bu script otomatik olarak:

- ✅ Node.js 20 kurar (yoksa)
- ✅ Python 3 + venv + build-essential kurar (yoksa)
- ✅ `.env` ve `bot/.env` şablon dosyalarını oluşturur
- ✅ Next.js bağımlılıklarını (`npm install`) kurar
- ✅ Python bağımlılıklarını **venv içinde** (`telethon`, `asyncpg`, `python-dotenv`) kurar
- ✅ Next.js'i production build alır

> ⏱️ İlk çalıştırma 3–5 dakika sürebilir (Node + npm install yavaş).

**Hata alırsanız:** [Sorun giderme](#10-sorun-giderme) bölümüne bakın.

Script bittiğinde "Kurulum tamamlandı 🎉" mesajını göreceksiniz.

---

## 6) .env dosyalarını doldurun (2 dk)

### 6.a — Site için: `~/harleyotopost/.env`

```bash
nano ~/harleyotopost/.env
```

İçeriği şu hale getirin (gerçek değerlerinizle):

```env
DATABASE_URL=postgresql://neondb_owner:Abc123xyz@ep-cool-haze-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
PANEL_USERNAME=admin
PANEL_PASSWORD=BENIM-GUCLU-PAROLAM-2026
PANEL_SECRET=rastgele-uzun-bir-string-en-az-32-karakter
PORT=3000
```

**Açıklamalar:**
- `DATABASE_URL` → 2. adımda Neon'dan kopyaladığınız string
- `PANEL_USERNAME` / `PANEL_PASSWORD` → siteye giriş için kullanacağınız bilgiler
- `PANEL_SECRET` → oturum şifreleme anahtarı, rastgele uzun bir şey (örn. `openssl rand -hex 32` çıktısı)
- `PORT=3000` → siteyi 3000'de dinlet

Kaydet: **CTRL+O** → **Enter** → **CTRL+X**.

### 6.b — Bot için: `~/harleyotopost/bot/.env`

```bash
nano ~/harleyotopost/bot/.env
```

```env
API_ID=12345678
API_HASH=0123456789abcdef0123456789abcdef
SESSION_STRING=
DATABASE_URL=postgresql://neondb_owner:Abc123xyz@ep-cool-haze-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require
HEARTBEAT_INTERVAL=30
```

**Açıklamalar:**
- `API_ID` ve `API_HASH` → 3. adımdaki Telegram bilgileri
- `SESSION_STRING` → **şimdilik boş** bırakın, 7. adımda dolduracağız
- `DATABASE_URL` → site `.env`'iyle **tamamen aynı** olmalı

Kaydet: **CTRL+O** → **Enter** → **CTRL+X**.

---

## 7) SESSION_STRING üretin (1 dk)

Bu adımı **sadece bir kez** yapacaksınız. Bot, Telegram'da sizin yerinize oturum açacak.

```bash
cd ~/harleyotopost/bot
source venv/bin/activate
python generate_session.py
```

Script size sırayla şunları soracak:

| Soru | Cevap |
|---|---|
| `API_ID:` | 3. adımdaki sayı |
| `API_HASH:` | 3. adımdaki hash |
| `Please enter your phone (or bot token):` | `+905XXXXXXXXX` (ülke kodu ile) |
| `Please enter the code you received:` | Telegram'a gelen 5 haneli kod |
| `Please enter your password:` | (Sadece 2FA açıksa) Telegram parolanız |

Sonunda terminale şöyle bir çıktı yazacak:

```
✅ Giriş başarılı: AdSoyad (@kullaniciadi)

Aşağıdaki SESSION_STRING'i bot/.env dosyasına yapıştırın:

SESSION_STRING=1ApWapzMBu5Qx......(çok uzun bir string)......
```

**Bu satırın tamamını kopyalayın.** Şimdi `bot/.env`'i tekrar açın:

```bash
nano ~/harleyotopost/bot/.env
```

Boş olan `SESSION_STRING=` satırını silin, kopyaladığınız satırı yapıştırın. Kaydedip çıkın.

> ⚠️ `SESSION_STRING` Telegram hesabınızın **anahtarıdır**. Kimseyle paylaşmayın!

`venv`'den çıkın:

```bash
deactivate
```

---

## 8) Servisleri başlatın (1 dk)

Hem site hem botu **kalıcı sistem servisi** olarak kuralım (sunucu yeniden başlasa bile otomatik açılırlar):

```bash
cd ~/harleyotopost
bash scripts/install-systemd.sh
```

Çıktıda şu satırları görmelisiniz:

```
✅ Servisler kuruldu ve başlatıldı.
```

**Durumu kontrol edin:**

```bash
sudo systemctl status harley-site
sudo systemctl status harley-bot
```

İkisinde de yeşil **`active (running)`** yazmalı. Ekrandan çıkmak için **q** tuşuna basın.

**Logları canlı izleyin (sorun varsa burada görürsünüz):**

```bash
sudo journalctl -u harley-bot -f
```

Bot doğru başlamışsa şuna benzer satırlar göreceksiniz:

```
Database connection pool created
Database tables initialized
✅ AdSoyad (@kullaniciadi) - Bot running
```

**CTRL+C** ile log izlemeyi durdurabilirsiniz (servis çalışmaya devam eder).

---

## 9) Siteye giriş yapın ve test edin

Tarayıcıdan açın:

```
http://SUNUCU_IP:3000
```

- **Kullanıcı adı:** `.env`'deki `PANEL_USERNAME` (varsayılan `admin`)
- **Parola:** `.env`'deki `PANEL_PASSWORD`

Giriş yaptıktan sonra:

1. **Hedef Kanallar** → Botun mesaj GÖNDERECEĞİ Telegram grubunu/kanalını ekleyin
2. **Kaynak Kanallar** → Botun DİNLEYECEĞİ kanalı ekleyin, hangi hedefe gideceğini seçin
3. **(Opsiyonel) Kurallar** → Belirli kelimelerde belirli hedeflere gönderme kuralları

> ⚠️ Botun mesaj yönlendirebilmesi için, oturum açtığınız Telegram hesabının **hem kaynak grupta hem de hedef grupta üye** olması gerekir.

Test için, kaynak gruba bir mesaj atın. Birkaç saniye içinde hedef grupta görünmeli. Olmazsa:

```bash
sudo journalctl -u harley-bot -f
```

Hata mesajına bakın.

---

## 10) Sorun giderme

### 🔴 `setup.sh` çalışırken `pip install` hata veriyor

Genelde `build-essential` veya `python3-dev` eksikliğindendir:

```bash
sudo apt update
sudo apt install -y build-essential python3-dev libffi-dev
cd ~/harleyotopost
bash setup.sh
```

### 🔴 `npm install` çok yavaş veya takılıyor

Sunucuda RAM düşükse swap açın:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 🔴 Bot loglarında `DATABASE_URL required!`

`bot/.env` boş veya yanlış konumda. Kontrol:

```bash
cat ~/harleyotopost/bot/.env
```

`DATABASE_URL=postgres...` satırı görünmüyorsa 6.b adımını tekrar yapın, sonra:

```bash
sudo systemctl restart harley-bot
```

### 🔴 Bot loglarında `connection refused` veya `could not connect to server`

`DATABASE_URL` yanlış veya Neon DB pasif (uzun süre kullanılmadığında Neon free plan'da uyur, ilk istek 1–2 sn sürer ama çalışır). Test edin:

```bash
psql "POSTGRES_URL_BURAYA"
```

Bağlanamazsa string'i tekrar Neon'dan kopyalayın. Sonunda `?sslmode=require` olmalı.

### 🔴 Bot loglarında `AuthKeyUnregisteredError` / `Session expired!`

`SESSION_STRING` geçersiz. 7. adımı tekrar yapın, yeni string'i yapıştırın, sonra:

```bash
sudo systemctl restart harley-bot
```

### 🔴 Site açılıyor ama login olduğumda 500 hatası

Site DB'ye bağlanamıyor. Site loglarına bakın:

```bash
sudo journalctl -u harley-site -n 50 --no-pager
```

Genelde `.env`'deki `DATABASE_URL` yanlış. Düzeltin, sonra:

```bash
sudo systemctl restart harley-site
```

### 🔴 Tarayıcıdan `SUNUCU_IP:3000` açılmıyor

İki olası neden:

1. **Firewall kapalı:** `sudo ufw allow 3000/tcp`
2. **Site çalışmıyor:** `sudo systemctl status harley-site` → `active (running)` değilse logları izleyin

### 🔴 "Kayıtlı kaynak kanal değil" logu

Bu **hata değil**. Bot, panelinize eklemediğiniz bir kanaldan mesaj gördüğünde bunu yazar (debug için). Yok sayabilirsiniz.

### 🔴 Port 3000 zaten kullanılıyor

`netstat -tlnp | grep 3000` ile kim kullanıyor görün. Başka uygulamaysa kapatın ya da `~/harleyotopost/.env` içinde `PORT=3001` yapıp servisi restart edin:

```bash
sudo systemctl restart harley-site
```

### 🟡 Bot mesajları görüyor ama hedef gruba göndermiyor

Sebep genelde:
- Telegram hesabınız hedef grupta üye değil → ekleyin
- Hedef grupta yazma yetkiniz yok → grup yöneticisinden isteyin
- Günlük limit dolmuş → panelden `daily_limit` artırın
- Bot panelden devre dışı bırakılmış → Ayarlar'dan açın

Detay için: `sudo journalctl -u harley-bot -f`

---

## 🔄 Faydalı komutlar

```bash
# Servisleri yeniden başlat (env değiştirdiğinizde)
sudo systemctl restart harley-site
sudo systemctl restart harley-bot

# Servisleri durdur
sudo systemctl stop harley-bot

# Açılışta otomatik başlamayı kapat
sudo systemctl disable harley-bot

# Son 100 satır log
sudo journalctl -u harley-bot -n 100 --no-pager

# Sadece bugünün logları
sudo journalctl -u harley-bot --since today --no-pager

# Bot kodunu güncellediyseniz
cd ~/harleyotopost
git pull   # veya yeni zip'i çıkardıysanız
cd bot && source venv/bin/activate && pip install -r requirements.txt && deactivate
cd ..
npm install && npm run build
sudo systemctl restart harley-site harley-bot
```

---

## 🆘 Hala çalışmıyor mu?

Aşağıdaki çıktıları toplayıp bana gönderin, hemen yardımcı olayım:

```bash
sudo systemctl status harley-bot --no-pager
sudo journalctl -u harley-bot -n 50 --no-pager
cat ~/harleyotopost/bot/.env | sed 's/=.*$/=***/'   # değerleri maskeler, sadece anahtarları görür
```
