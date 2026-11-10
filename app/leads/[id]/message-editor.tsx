'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  leadId: number;
  text: string;
  defaultText: string;
  isCustom: boolean;
}

export default function MessageEditor({ leadId, text, defaultText, isCustom }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(message: string | null) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Não foi possível salvar.');
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError('Não consegui falar com o servidor.');
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    setDraft(text);
    setError(null);
    setEditing(true);
  }

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Mensagem pronta {isCustom && <span className="ml-1 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">editada</span>}
        </p>
        {!editing && (
          <button type="button" onClick={startEditing} className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-900">
            Editar mensagem
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={7}
            maxLength={2000}
            className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900"
          />
          <p className="text-xs text-zinc-500">{draft.length}/2000 caracteres</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || !draft.trim()}
              onClick={() => save(draft)}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Salvar mensagem'}
            </button>
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900">
              Cancelar
            </button>
            {(isCustom || draft !== defaultText) && (
              <button
                type="button"
                disabled={saving}
                onClick={() => save(null)}
                className="px-2 py-2 text-sm text-amber-700 underline"
              >
                Restaurar mensagem padrão
              </button>
            )}
          </div>
          {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        </div>
      ) : (
        <p className="whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-sm text-zinc-900">{text}</p>
      )}
    </section>
  );
}
