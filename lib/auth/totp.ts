// Código de 6 dígitos que muda a cada 30 segundos (RFC 6238), compatível com
// Google Authenticator, Microsoft Authenticator, Authy e similares.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of str.toUpperCase().replace(/=+$/, '')) {
    const idx = BASE32.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function codeAt(secret: string, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

// Aceita o código atual e o anterior/seguinte (tolerância de relógio de 30 s).
export function verifyTotp(secret: string, code: string, window = 1): boolean {
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let w = -window; w <= window; w++) {
    const expected = Buffer.from(codeAt(secret, counter + w));
    if (timingSafeEqual(expected, Buffer.from(clean))) return true;
  }
  return false;
}

export function totpUri(email: string, secret: string): string {
  const label = encodeURIComponent(`Lead Ouro:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent('Lead Ouro')}&algorithm=SHA1&digits=6&period=30`;
}
