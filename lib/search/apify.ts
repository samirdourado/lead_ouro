import type { PlaceSearchProvider, RawPlace, SearchParams } from './provider';

// Ator do Google Maps usado para a busca. Conferir os nomes dos campos de entrada
// na página do ator antes da primeira busca grande.
const ACTOR_ID = 'compass~crawler-google-places';
const ENDPOINT = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

type ApifyItem = Record<string, unknown>;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

// Converte um item do Apify no formato interno. Itens sem placeId ou sem nome são descartados.
export function mapApifyItem(item: ApifyItem): RawPlace | null {
  const placeId = str(item.placeId);
  const title = str(item.title);
  if (!placeId || !title) return null;

  return {
    placeId,
    title,
    categoryName: str(item.categoryName),
    website: str(item.website),
    phone: str(item.phone),
    phoneUnformatted: str(item.phoneUnformatted),
    totalScore: num(item.totalScore),
    reviewsCount: num(item.reviewsCount),
    address: str(item.address),
    city: str(item.city),
    url: str(item.url),
    permanentlyClosed: item.permanentlyClosed === true || item.permanentlyClosed === 'true',
  };
}

export function buildActorInput({ category, location, limit }: SearchParams) {
  return {
    searchStringsArray: [category],
    locationQuery: location,
    maxCrawledPlacesPerSearch: limit,
    language: 'pt-BR',
    countryCode: 'br',
  };
}

export class ApifyPlaceSearch implements PlaceSearchProvider {
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(token: string, fetchImpl: typeof fetch = fetch) {
    if (!token) throw new Error('APIFY_TOKEN não configurado em .env.local');
    this.token = token;
    this.fetchImpl = fetchImpl;
  }

  async search(params: SearchParams): Promise<RawPlace[]> {
    const res = await this.fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildActorInput(params)),
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('Token do Apify inválido ou sem permissão (APIFY_TOKEN).');
    }
    if (!res.ok) {
      throw new Error(`Apify respondeu ${res.status} ao buscar "${params.category}" em "${params.location}".`);
    }

    const items = (await res.json()) as ApifyItem[];
    const places: RawPlace[] = [];
    for (const item of items) {
      const place = mapApifyItem(item);
      if (place) places.push(place);
    }
    return places;
  }
}
