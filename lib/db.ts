import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const globalForDb = globalThis as unknown as { __leadOuroDb?: DatabaseSync };

function openDatabase(): DatabaseSync {
  const dir = path.join(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, 'lead_ouro.db'));
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      rating REAL,
      reviews_count INTEGER,
      address TEXT,
      city TEXT,
      phone_raw TEXT,
      phone_wa TEXT,
      phone_is_mobile INTEGER NOT NULL DEFAULT 0,
      website_raw TEXT,
      website_type TEXT NOT NULL,
      website_domain TEXT,
      website_needs_review INTEGER NOT NULL DEFAULT 0,
      maps_url TEXT,
      permanently_closed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'novo',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      limit_requested INTEGER NOT NULL,
      requested_at TEXT NOT NULL,
      results_total INTEGER NOT NULL,
      results_new INTEGER NOT NULL,
      results_updated INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      template_id TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_contacts_lead ON contacts(lead_id);
  `);

  return db;
}

// Migrações de colunas adicionadas depois. Roda a cada getDb(), porque a conexão
// pode ter sido aberta por uma versão anterior do código que continua viva no servidor.
function ensureColumns(db: DatabaseSync) {
  const cols = (db.prepare('PRAGMA table_info(leads)').all() as unknown as { name: string }[]).map((c) => c.name);
  if (!cols.includes('custom_message')) {
    db.exec('ALTER TABLE leads ADD COLUMN custom_message TEXT');
  }
}

// Uma única conexão por processo. Em desenvolvimento o Next recarrega módulos,
// então guardamos a conexão em globalThis para não abrir várias.
export function getDb(): DatabaseSync {
  if (!globalForDb.__leadOuroDb) globalForDb.__leadOuroDb = openDatabase();
  ensureColumns(globalForDb.__leadOuroDb);
  return globalForDb.__leadOuroDb;
}
