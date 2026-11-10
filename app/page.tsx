import Link from 'next/link';
import { DEFAULT_STATUS, LEAD_STATUSES, STATUS_STYLE, type LeadStatus } from '@/lib/lead-status';
import { listDistinct, listLeads, type LeadFilters } from '@/lib/leads';
import type { WebsiteType } from '@/lib/website-classifier';
import LeadFiltersBar from './lead-filters';

const WEBSITE_LABELS: Record<WebsiteType, string> = {
  none: 'Sem site',
  social: 'Só rede social',
  whatsapp_link: 'Link de WhatsApp',
  link_hub: 'Página de links',
  builder_free: 'Site gratuito',
  own_domain: 'Domínio próprio',
};

// Lê o banco local a cada acesso: a página espera os dados em vez de ser pré-renderizada.
export const instant = false;

type SP = Promise<{ status?: string; websiteType?: string; category?: string; city?: string; q?: string }>;

export default async function LeadsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  // Sem ?status na URL, mostra só os leads novos. "todos" remove o filtro de status.
  const statusParam = sp.status ?? DEFAULT_STATUS;
  const status: LeadStatus | undefined =
    (LEAD_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as LeadStatus) : undefined;

  const filters: LeadFilters = {
    status,
    websiteType: sp.websiteType && sp.websiteType in WEBSITE_LABELS ? (sp.websiteType as WebsiteType) : undefined,
    category: sp.category || undefined,
    city: sp.city || undefined,
    q: sp.q || undefined,
  };
  const leads = listLeads(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leads ({leads.length})</h1>
        <Link href="/search" className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white">
          Nova busca
        </Link>
      </div>

      <LeadFiltersBar
        initial={{
          q: sp.q ?? '',
          category: sp.category ?? '',
          city: sp.city ?? '',
          status: statusParam,
          websiteType: sp.websiteType ?? '',
        }}
        statuses={LEAD_STATUSES}
        websiteTypes={(Object.keys(WEBSITE_LABELS) as WebsiteType[]).map((t) => ({ value: t, label: WEBSITE_LABELS[t] }))}
        categories={listDistinct('category')}
        cities={listDistinct('city')}
      />

      {leads.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          Nenhum lead com esses filtros.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link href={`/leads/${lead.id}`} className="relative flex flex-col gap-1 py-4 pl-4 pr-6 hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between">
                <span aria-hidden className={`absolute inset-y-0 right-0 w-1.5 ${STATUS_STYLE[lead.status].strip}`} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{lead.name}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {lead.category ?? 'Sem categoria'} · {lead.city ?? '—'}
                    {lead.rating != null && <> · ⭐ {lead.rating} ({lead.reviewsCount ?? 0})</>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-800">{WEBSITE_LABELS[lead.websiteType]}</span>
                  {lead.websiteNeedsReview && <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-800">verificar site</span>}
                  {lead.phoneWa ? (
                    <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">WhatsApp</span>
                  ) : (
                    <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-600">sem celular</span>
                  )}
                  <span className={`rounded px-2 py-1 ${STATUS_STYLE[lead.status].badge}`}>{lead.status}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
