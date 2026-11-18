'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAllowedEmail } from '@/lib/auth/allowlist';
import { hashPassword } from '@/lib/auth/password';
import { findUserByEmail, savePendingUser } from '@/lib/auth/users';
import { generateTotpSecret } from '@/lib/auth/totp';
import { SETUP_COOKIE, setupCookieOptions } from '@/lib/auth/setup-cookie';

export interface RegisterState {
  error: string | null;
}

export async function registerAccount(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  // O cadastro é restrito: só e-mails da lista ALLOWED_EMAILS podem criar conta.
  if (!isAllowedEmail(email)) {
    return { error: 'Este e-mail não tem permissão para se cadastrar.' };
  }
  if (password.length < 10) {
    return { error: 'A senha precisa ter pelo menos 10 caracteres.' };
  }
  if (password !== confirm) {
    return { error: 'As senhas não conferem.' };
  }

  const existing = await findUserByEmail(email);
  if (existing?.totp_enabled) {
    return { error: 'Já existe uma conta com este e-mail. Entre pela tela de login.' };
  }

  const token = await savePendingUser({
    email,
    name: name || email,
    passwordHash: await hashPassword(password),
    totpSecret: generateTotpSecret(),
  });

  const store = await cookies();
  store.set(SETUP_COOKIE, token, setupCookieOptions());
  redirect('/cadastro/2fa');
}
