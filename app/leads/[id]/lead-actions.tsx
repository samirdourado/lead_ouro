'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES } from '@/lib/lead-status';

interface Props {
  leadId: number;
  status: string;
  waLink: string | null;
  text: string | null;
}

async function logAction(leadId: number, action: 'opened' | 'copied') {
  try {
    await fetch(`/api/leads/${leadId}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  } catch {
    // Registrar o contato é secundário: se falhar, a ação na tela continua funcionando.
  }
}

export default function LeadActions({ leadId, status, waLink, text }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: string) {
    setSaving(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    logAction(leadId, 'copied');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logAction(leadId, 'opened')}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          >
            Chamar no WhatsApp
          </a>
        ) : (
          <span className="rounded-md bg-zinc-200 px-4 py-2 text-sm text-zinc-600">Sem celular para WhatsApp</span>
        )}
        {text && (
          <button type="button" onClick={copyText} className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm">
            {copied ? 'Copiado!' : 'Copiar mensagem'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="status" className="font-medium">Status:</label>
        <select
          id="status"
          value={status}
          disabled={saving}
          onChange={(e) => changeStatus(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
