import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLead, buildLeadOutreach, buildLeadMessage } from '@/lib/leads';
import LeadActions from './lead-actions';
import MessageEditor from './message-editor';
import { normalizeUrl } from '@/lib/website-classifier';

// Lê o banco local a cada acesso: a página espera os dados em vez de ser pré-renderizada.
export const instant = false;

const WEBSITE_HINTS: Record<string, string> = {
  none: 'Não tem site. Boa oportunidade para oferecer criação de site.',
  social: 'Só divulga por rede social. Oferecer site próprio.',
  whatsapp_link: 'O "site" é um link de WhatsApp. Oferecer site próprio.',
  link_hub: 'Usa página de links. Oferecer site próprio.',
  builder_free: 'Tem site em endereço gratuito. Oferecer site com domínio profissional.',
  own_domain: 'Tem domínio próprio. Oferecer otimização do Google Meu Negócio.',
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = getLead(Number(id));
  if (!lead) notFound();

  const outreach = buildLeadOutreach(lead);
  const msg = buildLeadMessage(lead);
  // Google às vezes traz "www.site.com.br" sem https: normalizamos para o link funcionar.
  const websiteHref = normalizeUrl(lead.websiteRaw);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">← Voltar aos leads</Link>

      <div>
        <h1 className="text-xl font-semibold">{lead.name}</h1>
        <p className="text-sm text-zinc-500">
          {lead.category ?? 'Sem categoria'} · {lead.city ?? '—'}
          {lead.rating != null && <> · ⭐ {lead.rating} ({lead.reviewsCount ?? 0} avaliações)</>}
        </p>
        {lead.permanentlyClosed && <p className="mt-1 text-sm font-medium text-red-700">Marcado como fechado no Google.</p>}
      </div>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-zinc-500">Endereço</p>
          <p>{lead.address ?? '—'}</p>
        </div>
        <div>
          <p className="text-zinc-500">Telefone</p>
          <p>
            {lead.phoneRaw ?? '—'}
            {lead.phoneRaw && !lead.phoneIsMobile && <span className="ml-2 text-xs text-yellow-700">(fixo, não recebe WhatsApp)</span>}
          </p>
        </div>
        <div>
          <p className="text-zinc-500">Site no Google</p>
          {websiteHref ? (
            <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="break-all text-amber-700 underline">
              {lead.websiteRaw}
            </a>
          ) : (
            <p>Nenhum</p>
          )}
        </div>
        <div>
          <p className="text-zinc-500">Tipo do site</p>
          <p>
            {lead.websiteDomain ?? '—'}
            {lead.websiteNeedsReview && <span className="ml-2 text-xs text-yellow-700">(verificar manualmente)</span>}
          </p>
          <p className="mt-1 text-xs text-zinc-600">{WEBSITE_HINTS[lead.websiteType]}</p>
        </div>
        {lead.mapsUrl && (
          <div className="sm:col-span-2">
            <a href={lead.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">Ver no Google Maps</a>
          </div>
        )}
      </section>

      <MessageEditor
        leadId={lead.id}
        text={msg.text}
        defaultText={msg.defaultText}
        isCustom={msg.isCustom}
      />

      <LeadActions
        leadId={lead.id}
        status={lead.status}
        waLink={outreach?.waLink ?? null}
        text={msg.text}
      />
    </div>
  );
}
