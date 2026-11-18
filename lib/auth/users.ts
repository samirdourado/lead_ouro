import { randomBytes } from 'node:crypto';
import { getDb } from '../db';

export interface UserRow {
  id: number;
  email: string;
  name: string | null;
  password_hash: string | null;
  totp_secret: string | null;
  totp_enabled: number;
  setup_token: string | null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email.toLowerCase()] });
  return (res.rows[0] as unknown as UserRow | undefined) ?? null;
}

// Cria (ou substitui, se o cadastro anterior nunca terminou) uma conta aguardando o 2FA.
// Devolve o token que liga o navegador a essa conta na etapa do 2FA.
export async function savePendingUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  totpSecret: string;
}): Promise<string> {
  const db = await getDb();
  const token = randomBytes(32).toString('hex');
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    await db.execute({
      sql: `UPDATE users SET name = ?, password_hash = ?, totp_secret = ?, totp_enabled = 0, setup_token = ? WHERE id = ?`,
      args: [input.name, input.passwordHash, input.totpSecret, token, existing.id],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO users (email, name, password_hash, totp_secret, totp_enabled, setup_token, created_at)
            VALUES (?, ?, ?, ?, 0, ?, ?)`,
      args: [email, input.name, input.passwordHash, input.totpSecret, token, new Date().toISOString()],
    });
  }
  return token;
}

export async function findUserBySetupToken(token: string): Promise<UserRow | null> {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM users WHERE setup_token = ?', args: [token] });
  return (res.rows[0] as unknown as UserRow | undefined) ?? null;
}

export async function completeTotpSetup(userId: number): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE users SET totp_enabled = 1, setup_token = NULL WHERE id = ?',
    args: [userId],
  });
}
