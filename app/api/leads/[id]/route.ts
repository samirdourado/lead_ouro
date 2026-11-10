import { NextResponse } from 'next/server';
import { getLead, setLeadMessage, setLeadStatus } from '@/lib/leads';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || !getLead(id)) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  let body: { status?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  try {
    if (typeof body.status === 'string') setLeadStatus(id, body.status);
    if (body.message !== undefined) {
      if (body.message !== null && typeof body.message !== 'string') {
        return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 });
      }
      if (typeof body.message === 'string' && body.message.length > 2000) {
        return NextResponse.json({ error: 'A mensagem passou de 2000 caracteres.' }, { status: 400 });
      }
      setLeadMessage(id, body.message as string | null);
    }
    return NextResponse.json({ lead: getLead(id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
