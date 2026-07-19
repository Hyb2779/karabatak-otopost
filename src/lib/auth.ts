import { scryptSync, timingSafeEqual } from 'crypto';
import { query } from '@/lib/db';

// Varsayilan giris bilgileri (DB'de kayit yoksa veya DB yoksa kullanilir)
const DEFAULT_USERNAME = process.env.PANEL_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.PANEL_PASSWORD || 'bonus2025';
const SECRET = process.env.PANEL_SECRET || 'tf-panel-secret';

export function hashPassword(password: string): string {
  return scryptSync(password, SECRET, 32).toString('hex');
}

export function makeToken(username: string): string {
  // Basit oturum isareti (hassas veri icermez)
  return Buffer.from(`${username}:${SECRET}`).toString('base64');
}

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

interface StoredCreds {
  username: string;
  passwordHash: string;
}

async function getStoredCredentials(): Promise<StoredCreds | null> {
  try {
    await ensureSettingsTable();
    const res = await query(
      `SELECT key, value FROM settings WHERE key IN ('panel_username', 'panel_password_hash')`
    );
    const map: Record<string, string> = {};
    for (const r of res.rows) map[r.key] = r.value;
    if (map.panel_username && map.panel_password_hash) {
      return { username: map.panel_username, passwordHash: map.panel_password_hash };
    }
  } catch {
    // Veritabani yok/erisilemiyor -> varsayilana don
  }
  return null;
}

export async function getEffectiveUsername(): Promise<string> {
  const stored = await getStoredCredentials();
  return stored?.username || DEFAULT_USERNAME;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const stored = await getStoredCredentials();
  if (stored) {
    if (username.trim() !== stored.username) return false;
    return safeEqual(hashPassword(password), stored.passwordHash);
  }
  // DB'de kayit yok -> env/varsayilan ile karsilastir
  return username.trim() === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
}

export async function setCredentials(newUsername: string, newPassword: string): Promise<void> {
  await ensureSettingsTable();
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('panel_username', $1, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
    [newUsername.trim()]
  );
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('panel_password_hash', $1, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
    [hashPassword(newPassword)]
  );
}
