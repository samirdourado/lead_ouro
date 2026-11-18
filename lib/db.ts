import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// Em produção: Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
// Sem essas variáveis: arquivo local data/lead_ouro.db (mesmo código, mesmo SQL).
const globalForDb = globalThis as unknown as { __leadOuroDb?: Promise<Client> };

const SCHEMA = `
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
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT,
    totp_secret TEXT,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    setup_token TEXT,
    google_sub TEXT UNIQUE,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_contacts_lead ON contacts(lead_id);
`;

async function openDb(): Promise<Client> {
  const remote = process.env.TURSO_DATABASE_URL;
  let url: string;
  if (remote) {
    url = remote;
  } else {
    const dir = path.join(process.cwd(), 'data');
    mkdirSync(dir, { recursive: true });
    url = `file:${path.join(dir, 'lead_ouro.db')}`;
  }

  const client = createClient({ url, authToken: remote ? process.env.TURSO_AUTH_TOKEN : undefined });
  await client.executeMultiple(SCHEMA);

  // Migração: colunas adicionadas depois da criação da tabela.
  const cols = (await client.execute('PRAGMA table_info(leads)')).rows.map((r) => String(r.name));
  if (!cols.includes('custom_message')) {
    await client.execute('ALTER TABLE leads ADD COLUMN custom_message TEXT');
  }
  return client;
}

// Uma conexão por processo, reaproveitada entre requisições.
export function getDb(): Promise<Client> {
  if (!globalForDb.__leadOuroDb) globalForDb.__leadOuroDb = openDb();
  return globalForDb.__leadOuroDb;
}
