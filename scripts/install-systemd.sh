#!/bin/bash
# Bu script systemd servislerini /etc/systemd/system/ altına kopyalar
# ve site + bot'u sunucu açılışında otomatik başlatır.
# Kullanım: bash scripts/install-systemd.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(whoami)}"
NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

if [ -z "$NODE_BIN" ] || [ -z "$NPM_BIN" ]; then
  echo "HATA: node veya npm bulunamadı. Önce setup.sh çalıştırın."
  exit 1
fi

echo "Proje dizini: $PROJECT_DIR"
echo "Servisleri çalıştıracak kullanıcı: $RUN_USER"

# --- Site servisi ---
sudo tee /etc/systemd/system/harley-site.service > /dev/null <<EOF
[Unit]
Description=HarleyOtoPost Next.js Site
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/.env
Environment=PORT=3000
Environment=NODE_ENV=production
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/$RUN_USER/.bun/bin
ExecStart=$NPM_BIN start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# --- Bot servisi ---
sudo tee /etc/systemd/system/harley-bot.service > /dev/null <<EOF
[Unit]
Description=HarleyOtoPost Telegram Bot
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$PROJECT_DIR/bot
EnvironmentFile=$PROJECT_DIR/bot/.env
ExecStart=$PROJECT_DIR/bot/venv/bin/python $PROJECT_DIR/bot/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable harley-site harley-bot
sudo systemctl restart harley-site harley-bot

echo ""
echo "✅ Servisler kuruldu ve başlatıldı."
echo ""
echo "Durum kontrol:"
echo "  sudo systemctl status harley-site"
echo "  sudo systemctl status harley-bot"
echo ""
echo "Canlı log:"
echo "  sudo journalctl -u harley-site -f"
echo "  sudo journalctl -u harley-bot -f"
echo ""
echo "Yeniden başlatma:"
echo "  sudo systemctl restart harley-site"
echo "  sudo systemctl restart harley-bot"
