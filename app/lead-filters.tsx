'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { DEFAULT_STATUS } from '@/lib/lead-status';

export interface FilterValues {
  q: string;
  category: string;
  city: string;
  status: string; // 'todos' = sem filtro de status
  websiteType: string;
}

interface Option {
  value: string;
  label: string;
}

interface Props {
  initial: FilterValues;
  statuses: readonly string[];
  websiteTypes: Option[];
  categories: string[];
  cities: string[];
}

// Seleções aplicam na hora. Nome aplica com Enter ou ao sair do campo.
export default function LeadFilters({ initial, statuses, websiteTypes, categories, cities }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<FilterValues>(initial);
  const [pending, startTransition] = useTransition();

  function apply(next: FilterValues) {
    setValues(next);
    const params = new URLSearchParams();
    // Status vai sempre na URL, para que "todos" não seja confundido com ausência de filtro.
    params.set('status', next.status);
    for (const key of ['q', 'category', 'city', 'websiteType'] as const) {
      if (next[key]) params.set(key, next[key]);
    }
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  const selectClass = 'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900';
  const isDefault =
    values.status === DEFAULT_STATUS && !values.q && !values.category && !values.city && !values.websiteType;

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply(values);
      }}
    >
      <input
        className={`${selectClass} placeholder:text-zinc-400`}
        placeholder="Buscar pelo nome"
        value={values.q}
        onChange={(e) => setValues({ ...values, q: e.target.value })}
        onBlur={() => apply(values)}
      />
      <select className={selectClass} value={values.category} onChange={(e) => apply({ ...values, category: e.target.value })}>
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select className={selectClass} value={values.city} onChange={(e) => apply({ ...values, city: e.target.value })}>
        <option value="">Todas as cidades</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select className={selectClass} value={values.status} onChange={(e) => apply({ ...values, status: e.target.value })}>
        <option value="todos">Todos os status</option>
        {statuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select className={selectClass} value={values.websiteType} onChange={(e) => apply({ ...values, websiteType: e.target.value })}>
        <option value="">Todos os sites</option>
        {websiteTypes.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {!isDefault && (
        <button
          type="button"
          onClick={() => apply({ q: '', category: '', city: '', status: DEFAULT_STATUS, websiteType: '' })}
          className="px-2 py-1.5 text-sm text-amber-700 underline"
        >
          Limpar filtros
        </button>
      )}
      {pending && <span className="text-xs text-zinc-500">atualizando…</span>}
    </form>
  );
}
