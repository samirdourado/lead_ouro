'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTotp } from '@/lib/auth/totp';
import { completeTotpSetup, findUserBySetupToken } from '@/lib/auth/users';
import { SETUP_COOKIE } from '@/lib/auth/setup-cookie';

export interface TotpState {
  error: string | null;
}

export async function confirmTotp(_prev: TotpState, formData: FormData): Promise<TotpState> {
  const store = await cookies();
  const token = store.get(SETUP_COOKIE)?.value;
  const user = token ? await findUserBySetupToken(token) : null;
  if (!user || !user.totp_secret) {
    return { error: 'Cadastro expirado. Comece de novo.' };
  }

  const code = String(formData.get('code') ?? '');
  if (!verifyTotp(user.totp_secret, code)) {
    return { error: 'Código incorreto. Confira o horário do celular e tente de novo.' };
  }

  await completeTotpSetup(user.id);
  store.delete(SETUP_COOKIE);
  redirect('/login?cadastrado=1');
}
