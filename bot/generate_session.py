"""
SESSION_STRING üretici.

Kullanım (Ubuntu sunucunuzda BİR KEZ çalıştırın):

    cd ~/harleyotopost/bot
    python3 -m venv venv
    source venv/bin/activate
    pip install telethon python-dotenv
    python generate_session.py

Sizden:
  1) API_ID (my.telegram.org'dan)
  2) API_HASH
  3) Telefon numarası (+90... formatında)
  4) Telegram'a gelen kod
  5) (Varsa) iki adımlı doğrulama parolası
istenecek. Sonunda uzun bir SESSION_STRING basacak.
Bu string'i bot/.env içine SESSION_STRING=... olarak yapıştırın.
"""
from telethon.sync import TelegramClient
from telethon.sessions import StringSession


def main():
    print("=" * 60)
    print("Telegram SESSION_STRING Üretici")
    print("=" * 60)
    print("API_ID ve API_HASH'i https://my.telegram.org > API development tools")
    print("adresinden alabilirsiniz.\n")

    api_id_str = input("API_ID: ").strip()
    api_hash = input("API_HASH: ").strip()

    try:
        api_id = int(api_id_str)
    except ValueError:
        print("HATA: API_ID sayı olmalı!")
        return

    print("\nTelegram'a giriş yapılıyor... Telefon ve kod istenecek.")
    with TelegramClient(StringSession(), api_id, api_hash) as client:
        session_str = client.session.save()
        me = client.get_me()
        print("\n" + "=" * 60)
        print(f"✅ Giriş başarılı: {me.first_name} (@{me.username or 'kullanıcı adı yok'})")
        print("=" * 60)
        print("\nAşağıdaki SESSION_STRING'i bot/.env dosyasına yapıştırın:\n")
        print("SESSION_STRING=" + session_str)
        print("\n⚠️  Bu string'i KİMSEYLE paylaşmayın! Telegram hesabınızın anahtarıdır.")


if __name__ == "__main__":
    main()
