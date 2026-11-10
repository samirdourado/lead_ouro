export type WebsiteType =
  | 'none'
  | 'social'
  | 'whatsapp_link'
  | 'link_hub'
  | 'builder_free'
  | 'own_domain';

export interface WebsiteClassification {
  type: WebsiteType;
  domain: string | null;
  label: string;
  needsReview: boolean;
}

// Domínio exato ou qualquer subdomínio dele.
const SOCIAL = [
  'instagram.com',
  'facebook.com',
  'fb.me',
  'fb.com',
  'tiktok.com',
  'linkedin.com',
  'youtube.com',
  'youtu.be',
  'x.com',
  'twitter.com',
];

const WHATSAPP = ['wa.me', 'api.whatsapp.com', 'whatsapp.com'];

const LINK_HUB = ['linktr.ee', 'beacons.ai', 'bio.site', 'lnk.bio', 'keepo.bio', 'bit.ly', 'linkin.bio'];

// Plataformas gratuitas/de baixo custo onde o cliente tem "site", mas não é domínio próprio.
const BUILDER_FREE = [
  'lovable.app',
  'wixsite.com',
  'sites.google.com',
  'carrd.co',
  'weebly.com',
  'blogspot.com',
  'wordpress.com',
  'netlify.app',
  'vercel.app',
  'localo.site',
  'canva.site',
  'lojaintegrada.com.br',
];

const LABELS: Record<WebsiteType, string> = {
  none: 'Sem site',
  social: 'Só rede social',
  whatsapp_link: 'Link de WhatsApp',
  link_hub: 'Página de links',
  builder_free: 'Site gratuito/builder',
  own_domain: 'Tem domínio próprio',
};

export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).href;
  } catch {
    return null;
  }
}

export function extractDomain(raw: string | null | undefined): string | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
}

function matches(domain: string, list: string[]): boolean {
  return list.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function classifyWebsite(raw: string | null | undefined): WebsiteClassification {
  const domain = extractDomain(raw);

  if (!domain) {
    return { type: 'none', domain: null, label: LABELS.none, needsReview: false };
  }

  let type: WebsiteType;
  if (matches(domain, WHATSAPP)) type = 'whatsapp_link';
  else if (matches(domain, SOCIAL)) type = 'social';
  else if (matches(domain, LINK_HUB)) type = 'link_hub';
  else if (matches(domain, BUILDER_FREE)) type = 'builder_free';
  else type = 'own_domain';

  // Domínio próprio não reconhecido por lista pode ser encurtador ou plataforma nova: vale checar.
  const needsReview = type === 'own_domain' && /\.(site|bio|link|click|page)$/.test(domain);

  return { type, domain, label: LABELS[type], needsReview };
}
