#!/bin/bash
# HarleyOtoPost — Ubuntu sunucu için tek seferlik otomatik kurulum
# Kullanım:  bash setup.sh

set -e

# Renkler
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1;34m'; NC='\033[0m'

log()  { echo -e "${G}[✓]${NC} $*"; }
warn() { echo -e "${Y}[!]${NC} $*"; }
err()  { echo -e "${R}[✗]${NC} $*" >&2; }
step() { echo -e "\n${B}==>${NC} ${B}$*${NC}"; }

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

step "HarleyOtoPost kurulumu başlıyor"
echo "Proje dizini: $PROJECT_DIR"

# ---------------------------------------------------------------------------
# 1) Sistem paketleri
# ---------------------------------------------------------------------------
step "1/6  Sistem paketleri kontrol ediliyor"

NEED_APT_UPDATE=0

require_apt() {
  if ! dpkg -s "$1" >/dev/null 2>&1; then
    NEED_APT_UPDATE=1
    warn "$1 kurulu değil, kurulacak"
    APT_INSTALL+=("$1")
  fi
}

APT_INSTALL=()
require_apt curl
require_apt unzip
require_apt git
require_apt build-essential
require_apt python3
require_apt python3-pip
require_apt python3-venv
require_apt python3-dev

if [ "$NEED_APT_UPDATE" = "1" ]; then
  sudo apt-get update -y
  sudo apt-get install -y "${APT_INSTALL[@]}"
fi
log "Sistem paketleri tamam"

# Node.js
if ! command -v node >/dev/null 2>&1; then
  warn "Node.js bulunamadı, NodeSource 20.x kuruluyor..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
log "Node.js $(node -v) bulundu"

# npm (Node ile gelir ama emin olalım)
if ! command -v npm >/dev/null 2>&1; then
  err "npm bulunamadı, Node.js kurulumu eksik"
  exit 1
fi
log "npm $(npm -v) bulundu"

# ---------------------------------------------------------------------------
# 2) .env şablonlarını oluştur (varsa dokunma)
# ---------------------------------------------------------------------------
step "2/6  .env dosyaları hazırlanıyor"

# Kök .env.example yoksa oluştur
if [ ! -f "$PROJECT_DIR/.env.example" ]; then
  cat > "$PROJECT_DIR/.env.example" << 'EOF'
# =============================================================
#  HarleyOtoPost — Next.js Panel (.env)
# =============================================================

# PostgreSQL bağlantı URL'si (Neon, Supabase, kendi sunucu vb.)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Panel giriş bilgileri (DB'de kayıt yokken kullanılır)
PANEL_USERNAME=admin
PANEL_PASSWORD=bonus2025

# Oturum imzalama için gizli anahtar — güçlü ve rastgele bir değer girin
PANEL_SECRET=degistir_beni_guclu_rastgele_bir_deger
EOF
  log ".env.example şablonu oluşturuldu"
fi

# Bot .env.example yoksa oluştur
if [ ! -f "$PROJECT_DIR/bot/.env.example" ]; then
  cat > "$PROJECT_DIR/bot/.env.example" << 'EOF'
# =============================================================
#  HarleyOtoPost — Telegram Bot (bot/.env)
# =============================================================

# Telegram API bilgileri — https://my.telegram.org/apps adresinden alın
API_ID=0
API_HASH=

# Oturum dizesi — python generate_session.py komutuyla üretin
SESSION_STRING=

# PostgreSQL bağlantı URL'si (site .env ile aynı olabilir)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Kalp atışı aralığı (saniye) — varsayılan: 30
HEARTBEAT_INTERVAL=30
EOF
  log "bot/.env.example şablonu oluşturuldu"
fi

if [ ! -f "$PROJECT_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
  warn ".env oluşturuldu — kurulum sonunda DOLDURMALISINIZ"
else
  log ".env zaten mevcut, dokunulmadı"
fi

if [ ! -f "$PROJECT_DIR/bot/.env" ]; then
  cp "$PROJECT_DIR/bot/.env.example" "$PROJECT_DIR/bot/.env"
  warn "bot/.env oluşturuldu — kurulum sonunda DOLDURMALISINIZ"
else
  log "bot/.env zaten mevcut, dokunulmadı"
fi

# ---------------------------------------------------------------------------
# 3) Site bağımlılıkları
# ---------------------------------------------------------------------------
step "3/6  Site (Next.js) bağımlılıkları kuruluyor"
cd "$PROJECT_DIR"
npm install --no-audit --no-fund
log "Site bağımlılıkları kuruldu"

# ---------------------------------------------------------------------------
# 4) Bot bağımlılıkları (venv içinde)
# ---------------------------------------------------------------------------
step "4/6  Bot (Python) bağımlılıkları kuruluyor"
cd "$PROJECT_DIR/bot"

if [ ! -d "venv" ]; then
  python3 -m venv venv
  log "Python virtualenv oluşturuldu"
fi

# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
log "Zorunlu paketler kuruldu (telethon, asyncpg, python-dotenv)"

# Opsiyonel cryptg — hata olursa atlat
if pip install --quiet -r requirements-optional.txt 2>/dev/null; then
  log "cryptg kuruldu (kriptografi hızlandırması aktif)"
else
  warn "cryptg kurulamadı — sorun değil, bot bu olmadan da çalışır"
fi
deactivate

# ---------------------------------------------------------------------------
# 5) Site production build
# ---------------------------------------------------------------------------
step "5/6  Site production build alınıyor"
cd "$PROJECT_DIR"
npm run build
log "Build hazır (.next klasörü)"

# ---------------------------------------------------------------------------
# 6) Bitti
# ---------------------------------------------------------------------------
step "6/6  Kurulum tamamlandı 🎉"

echo ""
echo "─────────────────────────────────────────────────────────"
echo " SIRADAKİ ADIMLAR (sırasıyla yapın!)"
echo "─────────────────────────────────────────────────────────"
echo ""
echo " 1) Neon.tech'ten ücretsiz PostgreSQL alın (KURULUM.md'de detay)"
echo ""
echo " 2) İki .env dosyasını DOLDURUN:"
echo "      nano $PROJECT_DIR/.env"
echo "      nano $PROJECT_DIR/bot/.env"
echo ""
echo " 3) Telegram SESSION_STRING üretin:"
echo "      cd $PROJECT_DIR/bot"
echo "      source venv/bin/activate"
echo "      python generate_session.py"
echo "    Çıkan satırı bot/.env içindeki SESSION_STRING= satırına yapıştırın."
echo ""
echo " 4) Servisleri kalıcı olarak başlatın:"
echo "      cd $PROJECT_DIR"
echo "      bash scripts/install-systemd.sh"
echo ""
echo " 5) Tarayıcıdan açın:  http://SUNUCU_IP:3000"
echo ""
echo " Logları izlemek için:"
echo "      sudo journalctl -u harley-bot -f"
echo ""
