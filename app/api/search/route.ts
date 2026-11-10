import { NextResponse } from 'next/server';
import { ApifyPlaceSearch } from '@/lib/search/apify';
import { ingestSearch } from '@/lib/leads';

const MAX_LIMIT = 100;

export async function POST(request: Request) {
  let body: { category?: unknown; location?: unknown; limit?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const limit = Number(body.limit ?? 20);

  if (!category || !location) {
    return NextResponse.json({ error: 'Informe categoria e cidade.' }, { status: 400 });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return NextResponse.json({ error: `O limite deve ser um número entre 1 e ${MAX_LIMIT}.` }, { status: 400 });
  }

  try {
    const provider = new ApifyPlaceSearch(process.env.APIFY_TOKEN ?? '');
    const places = await provider.search({ category, location, limit });
    const result = ingestSearch({ category, location, limit }, places);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado na busca.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
