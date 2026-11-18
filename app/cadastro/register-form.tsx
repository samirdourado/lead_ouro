'use client';

import { useActionState } from 'react';
import { registerAccount, type RegisterState } from './actions';

const initial: RegisterState = { error: null };

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAccount, initial);
  const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">Seu nome</label>
        <input id="name" name="name" autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">E-mail autorizado</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">Senha (mínimo 10 caracteres)</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="confirm">Repita a senha</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </div>

      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Criando…' : 'Continuar'}
      </button>
    </form>
  );
}
