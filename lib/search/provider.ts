// Formato bruto devolvido por qualquer provedor (Apify, Google Places, CSV antigo).
// Os nomes seguem o dataset do ator compass/crawler-google-places.
export interface RawPlace {
  placeId: string;
  title: string;
  categoryName?: string | null;
  website?: string | null;
  phone?: string | null;
  phoneUnformatted?: string | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  address?: string | null;
  city?: string | null;
  url?: string | null;
  permanentlyClosed?: boolean;
}

export interface SearchParams {
  category: string;
  location: string;
  limit: number;
}

export interface PlaceSearchProvider {
  search(params: SearchParams): Promise<RawPlace[]>;
}
