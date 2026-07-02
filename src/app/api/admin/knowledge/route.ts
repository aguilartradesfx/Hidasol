import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/agent/supabase-server';
import { embed as defaultEmbed } from '@/lib/agent/embeddings';

interface Deps { client: any; embed: typeof defaultEmbed; }

export async function handleUpsert(body: any, deps: Deps): Promise<{ status: number; body: any }> {
  const contenido = (body?.contenido ?? '').trim();
  if (!contenido) return { status: 400, body: { error: 'contenido requerido' } };
  const embedding = await deps.embed(contenido);
  const row: any = { contenido, categoria: body.categoria ?? null, embedding };
  if (body.id) row.id = body.id;
  const { error } = await deps.client.from('knowledge_chunks').upsert(row);
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { ok: true } };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const res = await handleUpsert(body, { client: getServiceClient(), embed: defaultEmbed });
  return NextResponse.json(res.body, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  const { error } = await getServiceClient().from('knowledge_chunks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
