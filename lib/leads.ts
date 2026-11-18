import { getDb } from './db';
import { LEAD_STATUSES, type LeadStatus } from './lead-status';
import { classifyWebsite, type WebsiteType } from './website-classifier';
import { cleanName, isMobile, shortBusinessName, toWhatsAppNumber } from './normalize';
import { TEMPLATES, buildWhatsAppLink, type MessageContext } from './messages';
import type { RawPlace, SearchParams } from './search/provider';

export interface LeadRow {
  id: number;
  placeId: string;
  name: string;
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  address: string | null;
  city: string | null;
  phoneRaw: string | null;
  phoneWa: string | null;
  phoneIsMobile: boolean;
  websiteRaw: string | null;
  websiteType: WebsiteType;
  websiteDomain: string | null;
  websiteNeedsReview: boolean;
  mapsUrl: string | null;
  permanentlyClosed: boolean;
  status: LeadStatus;
  // Mensagem editada pelo usuário. Null = usa o modelo padrão do tipo de site.
  customMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  websiteType?: WebsiteType;
  category?: string;
  city?: string;
  q?: string;
}

export interface IngestResult {
  total: number;
  added: number;
  updated: number;
}

// Linha crua do banco (nomes de coluna em snake_case).
interface DbLead {
  id: number;
  place_id: string;
  name: string;
  category: string | null;
  rating: number | null;
  reviews_count: number | null;
  address: string | null;
  city: string | null;
  phone_raw: string | null;
  phone_wa: string | null;
  phone_is_mobile: number;
  website_raw: string | null;
  website_type: WebsiteType;
  website_domain: string | null;
  website_needs_review: number;
  maps_url: string | null;
  permanently_closed: number;
  status: LeadStatus;
  custom_message: string | null;
  created_at: string;
  updated_at: string;
}

function toLead(r: DbLead): LeadRow {
  return {
    id: Number(r.id),
    placeId: r.place_id,
    name: r.name,
    category: r.category,
    rating: r.rating,
    reviewsCount: r.reviews_count,
    address: r.address,
    city: r.city,
    phoneRaw: r.phone_raw,
    phoneWa: r.phone_wa,
    phoneIsMobile: Number(r.phone_is_mobile) === 1,
    websiteRaw: r.website_raw,
    websiteType: r.website_type,
    websiteDomain: r.website_domain,
    websiteNeedsReview: Number(r.website_needs_review) === 1,
    mapsUrl: r.maps_url,
    permanentlyClosed: Number(r.permanently_closed) === 1,
    status: r.status,
    customMessage: r.custom_message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Grava a busca: cada lugar vira lead novo ou atualiza o existente (chave: placeId).
// Status, histórico de contatos e created_at nunca são sobrescritos.
export async function ingestSearch(params: SearchParams, places: RawPlace[]): Promise<IngestResult> {
  const db = await getDb();
  const now = new Date().toISOString();
  let added = 0;
  let updated = 0;

  const tx = await db.transaction('write');
  try {
    for (const p of places) {
      const cls = classifyWebsite(p.website);
      const waNumber = toWhatsAppNumber(p.phoneUnformatted ?? p.phone);
      const mobile = isMobile(waNumber);
      // Telefone fixo não recebe WhatsApp: guardamos o número bruto, mas não o número de WhatsApp.
      const phoneWa = mobile ? waNumber : null;
      const values = [
        cleanName(p.title),
        p.categoryName ?? null,
        p.totalScore ?? null,
        p.reviewsCount ?? null,
        p.address ?? null,
        p.city ?? null,
        p.phone ?? p.phoneUnformatted ?? null,
        phoneWa,
        mobile ? 1 : 0,
        p.website ?? null,
        cls.type,
        cls.domain,
        cls.needsReview ? 1 : 0,
        p.url ?? null,
        p.permanentlyClosed ? 1 : 0,
      ];

      const existing = await tx.execute({ sql: 'SELECT id FROM leads WHERE place_id = ?', args: [p.placeId] });
      if (existing.rows.length > 0) {
        await tx.execute({
          sql: `UPDATE leads SET
            name = ?, category = ?, rating = ?, reviews_count = ?, address = ?, city = ?,
            phone_raw = ?, phone_wa = ?, phone_is_mobile = ?, website_raw = ?, website_type = ?,
            website_domain = ?, website_needs_review = ?, maps_url = ?, permanently_closed = ?,
            updated_at = ?
          WHERE place_id = ?`,
          args: [...values, now, p.placeId],
        });
        updated++;
      } else {
        await tx.execute({
          sql: `INSERT INTO leads (
            place_id, name, category, rating, reviews_count, address, city,
            phone_raw, phone_wa, phone_is_mobile, website_raw, website_type,
            website_domain, website_needs_review, maps_url, permanently_closed,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?, ?)`,
          args: [p.placeId, ...values, now, now],
        });
        added++;
      }
    }

    await tx.execute({
      sql: `INSERT INTO searches (category, location, limit_requested, requested_at, results_total, results_new, results_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [params.category, params.location, params.limit, now, places.length, added, updated],
    });

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  return { total: places.length, added, updated };
}

// Ordem alfabética em português (acentos incluídos).
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

export async function listLeads(filters: LeadFilters = {}): Promise<LeadRow[]> {
  const db = await getDb();
  const where: string[] = [];
  const args: string[] = [];

  if (filters.status) {
    where.push('status = ?');
    args.push(filters.status);
  }
  if (filters.websiteType) {
    where.push('website_type = ?');
    args.push(filters.websiteType);
  }
  if (filters.category) {
    where.push('category = ?');
    args.push(filters.category);
  }
  if (filters.city) {
    where.push('city = ?');
    args.push(filters.city);
  }
  if (filters.q) {
    where.push('name LIKE ?');
    args.push(`%${filters.q}%`);
  }

  const sql = `SELECT * FROM leads ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`;
  const res = await db.execute({ sql, args });
  const rows = (res.rows as unknown as DbLead[]).map(toLead);
  return rows.sort((a, b) => collator.compare(a.name, b.name));
}

// Valores distintos para preencher os selects de filtro (categoria, cidade).
export async function listDistinct(column: 'category' | 'city'): Promise<string[]> {
  const db = await getDb();
  const res = await db.execute(
    `SELECT DISTINCT ${column} AS v FROM leads WHERE ${column} IS NOT NULL AND ${column} <> ''`,
  );
  return res.rows.map((r) => String(r.v)).sort((a, b) => collator.compare(a, b));
}

// Salva a mensagem editada. Texto vazio (ou null) volta ao modelo padrão.
export async function setLeadMessage(id: number, message: string | null): Promise<boolean> {
  const db = await getDb();
  const clean = message?.trim() ? message.trim() : null;
  const res = await db.execute({
    sql: 'UPDATE leads SET custom_message = ?, updated_at = ? WHERE id = ?',
    args: [clean, new Date().toISOString(), id],
  });
  return res.rowsAffected > 0;
}

export async function getLead(id: number): Promise<LeadRow | null> {
  const db = await getDb();
  const res = await db.execute({ sql: 'SELECT * FROM leads WHERE id = ?', args: [id] });
  const row = res.rows[0] as unknown as DbLead | undefined;
  return row ? toLead(row) : null;
}

export async function setLeadStatus(id: number, status: string): Promise<boolean> {
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Status inválido: ${status}`);
  }
  const db = await getDb();
  const res = await db.execute({
    sql: 'UPDATE leads SET status = ?, updated_at = ? WHERE id = ?',
    args: [status, new Date().toISOString(), id],
  });
  return res.rowsAffected > 0;
}

export async function registerContact(leadId: number, action: 'opened' | 'copied', templateId: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: 'INSERT INTO contacts (lead_id, channel, template_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [leadId, 'whatsapp', templateId, action, new Date().toISOString()],
  });
}

export function messageContextFromEnv(businessName: string): MessageContext {
  return {
    businessName: shortBusinessName(businessName),
    // Sem SENDER_NAME, a mensagem diz "a equipe" em vez de inventar um nome.
    senderName: process.env.SENDER_NAME?.trim() || 'a equipe',
    portfolioUrl: process.env.PORTFOLIO_URL?.trim() ?? '',
  };
}

// Mensagem do lead: a editada pelo usuário, ou o modelo padrão do tipo de site.
export function buildLeadMessage(lead: LeadRow): {
  templateId: string;
  defaultText: string;
  text: string;
  isCustom: boolean;
} {
  const template = TEMPLATES[lead.websiteType];
  const defaultText = template.build(messageContextFromEnv(lead.name));
  const isCustom = lead.customMessage !== null;
  return {
    templateId: isCustom ? 'personalizada' : template.id,
    defaultText,
    text: isCustom ? (lead.customMessage as string) : defaultText,
    isCustom,
  };
}

// Link wa.me pronto para um lead. Null se não houver celular válido.
export function buildLeadOutreach(lead: LeadRow): { templateId: string; text: string; waLink: string } | null {
  if (!lead.phoneWa) return null;
  const msg = buildLeadMessage(lead);
  return {
    templateId: msg.templateId,
    text: msg.text,
    waLink: buildWhatsAppLink(lead.phoneWa, msg.text),
  };
}
