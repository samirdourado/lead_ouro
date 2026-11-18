'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';

export interface LoginState {
  error: string | null;
}

export async function loginWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      code: String(formData.get('code') ?? ''),
      redirectTo: '/',
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: 'E-mail, senha ou código incorreto.' };
    }
    throw err; // redirecionamento do Next precisa seguir adiante
  }
  return { error: null };
}

export async function loginWithGoogle(): Promise<void> {
  await signIn('google', { redirectTo: '/' });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
