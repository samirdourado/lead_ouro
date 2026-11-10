import type { WebsiteType } from './website-classifier';

export interface MessageContext {
  businessName: string;
  senderName: string;
  portfolioUrl: string;
}

export interface MessageTemplate {
  id: string;
  build: (ctx: MessageContext) => string;
}

const link = (url: string) => (url ? ` ${url}` : '');

// Um template por tipo de site: a abordagem muda conforme o que o lead já tem.
export const TEMPLATES: Record<WebsiteType, MessageTemplate> = {
  none: {
    id: 'sem_site',
    build: (c) =>
      `Olá, ${c.businessName}! Tudo bem? Aqui é ${c.senderName}, da Dourado Comunicação. ` +
      `Vi o perfil de vocês no Google e notei que ainda não têm um site. ` +
      `Criamos sites profissionais e páginas de conversão. Posso te mostrar nosso trabalho?${link(c.portfolioUrl)}`,
  },
  social: {
    id: 'so_rede_social',
    build: (c) =>
      `Olá, ${c.businessName}! Tudo bem? Aqui é ${c.senderName}, da Dourado Comunicação. ` +
      `Vi que vocês divulgam o trabalho pelas redes sociais, mas ainda não têm um site próprio. ` +
      `Um site profissional ajuda a aparecer no Google e a passar mais confiança. Posso te mostrar nosso trabalho?${link(c.portfolioUrl)}`,
  },
  whatsapp_link: {
    id: 'link_whatsapp',
    build: (c) =>
      `Olá, ${c.businessName}! Tudo bem? Aqui é ${c.senderName}, da Dourado Comunicação. ` +
      `Vi que o contato de vocês no Google é só um link de WhatsApp. Um site com domínio próprio ajuda a ser encontrado e a passar mais confiança. ` +
      `Posso te mostrar nosso trabalho?${link(c.portfolioUrl)}`,
  },
  link_hub: {
    id: 'pagina_de_links',
    build: (c) =>
      `Olá, ${c.businessName}! Tudo bem? Aqui é ${c.senderName}, da Dourado Comunicação. ` +
      `Vi que vocês usam uma página de links no Google. Um site próprio pode mostrar melhor seus serviços e aparecer nas buscas. ` +
      `Posso te mostrar nosso trabalho?${link(c.portfolioUrl)}`,
  },
  builder_free: {
    id: 'site_gratuito',
    build: (c) =>
      `Olá, ${c.businessName}! Tudo bem? Aqui é ${c.senderName}, da Dourado Comunicação. ` +
      `Vi que o site de vocês está num endereço gratuito. Criamos sites com domínio profissional, com a mesma estrutura, mas com mais credibilidade. ` +
      `Posso te mostrar nosso trabalho?${link(c.portfolioUrl)}`,
  },
  own_domain: {
    id: 'google_meu_negocio',
    build: (c) =>
      `Olá, ${c.businessName}! Tudo bem? Aqui é ${c.senderName}, da Dourado Comunicação. ` +
      `Vi o site e o perfil de vocês no Google. Trabalhamos com otimização do Google Meu Negócio para aparecer mais nas buscas da região. ` +
      `Posso te mostrar nosso trabalho?${link(c.portfolioUrl)}`,
  },
};

export function buildWhatsAppLink(waNumber: string, text: string): string {
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}
