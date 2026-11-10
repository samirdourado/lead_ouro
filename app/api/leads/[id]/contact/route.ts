import { NextResponse } from 'next/server';
import { buildLeadOutreach, getLead, registerContact } from '@/lib/leads';

type Ctx = { params: Promise<{ id: string }> };

// Registra que o usuário abriu o WhatsApp ou copiou a mensagem.
// Não envia nada: o envio é feito manualmente no WhatsApp.
export async function POST(request: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const lead = Number.isInteger(id) ? getLead(id) : null;
  if (!lead) {
    return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
  }

  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }
  if (body.action !== 'opened' && body.action !== 'copied') {
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  }

  const outreach = buildLeadOutreach(lead);
  if (!outreach) {
    return NextResponse.json({ error: 'Este lead não tem celular válido para WhatsApp.' }, { status: 400 });
  }

  registerContact(lead.id, body.action, outreach.templateId);
  return NextResponse.json({ ok: true });
}
