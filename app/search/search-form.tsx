'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ total: number; added: number; updated: number } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, location, limit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro na busca.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Não consegui falar com o servidor. Verifique se o app está rodando.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm';

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-sm font-medium">Categoria</label>
        <input className={inputClass} placeholder="ex.: advogado" value={category} onChange={(e) => setCategory(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Cidade</label>
        <input className={inputClass} placeholder="ex.: São Paulo SP" value={location} onChange={(e) => setLocation(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Quantidade (máx. 100)</label>
        <input type="number" min={1} max={100} className={inputClass} value={limit} onChange={(e) => setLimit(Number(e.target.value))} required />
        <p className="mt-1 text-xs text-zinc-500">Cada resultado tem custo no Apify (cerca de US$ 1,50 por 1.000 lugares).</p>
      </div>
      <button type="submit" disabled={loading} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {loading ? 'Buscando… isso pode levar um minuto' : 'Buscar empresas'}
      </button>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          <p>
            {result.total} resultados: {result.added} novos e {result.updated} já existiam (dados atualizados, status mantido).
          </p>
          <button type="button" onClick={() => router.push('/')} className="mt-2 font-medium underline">
            Ver leads
          </button>
        </div>
      )}
    </form>
  );
}
