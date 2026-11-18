'use client';

import { useActionState } from 'react';
import { loginWithGoogle, loginWithPassword, type LoginState } from './actions';

const initial: LoginState = { error: null };

export default function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(loginWithPassword, initial);
  const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <form action={loginWithGoogle}>
          <button type="submit" className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900">
            Entrar com Google
          </button>
        </form>
      )}

      {googleEnabled && (
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" /> ou com senha <span className="h-px flex-1 bg-zinc-200" />
        </div>
      )}

      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="code">Código do app autenticador</label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="123456"
            required
            className={`${inputClass} tracking-widest`}
          />
        </div>

        {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Primeiro acesso?{' '}
        <a href="/cadastro" className="font-medium text-amber-700 underline">Criar conta</a>
      </p>
    </div>
  );
}
