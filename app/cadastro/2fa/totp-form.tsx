'use client';

import { useActionState } from 'react';
import { confirmTotp, type TotpState } from './actions';

const initial: TotpState = { error: null };

export default function TotpForm() {
  const [state, formAction, pending] = useActionState(confirmTotp, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="code">Código de 6 dígitos que apareceu no app</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          required
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-lg tracking-widest text-zinc-900"
        />
      </div>
      {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-amber-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Confirmando…' : 'Ativar conta'}
      </button>
    </form>
  );
}
