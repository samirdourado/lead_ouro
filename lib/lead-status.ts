// Fica fora de db.ts para poder ser importado por componentes do navegador.
export const LEAD_STATUSES = ['novo', 'contatado', 'respondeu', 'fechado', 'descartado', 'negado'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// Status mostrado por padrão na lista de leads.
export const DEFAULT_STATUS: LeadStatus = 'novo';

// Cores por status. Classes escritas por extenso para o Tailwind gerar o CSS.
// strip: faixa na lateral do card. badge: selo com o nome do status.
export const STATUS_STYLE: Record<LeadStatus, { strip: string; badge: string }> = {
  novo: { strip: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  contatado: { strip: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
  respondeu: { strip: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
  fechado: { strip: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' },
  descartado: { strip: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800' },
  negado: { strip: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
};
