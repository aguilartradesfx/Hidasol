import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/agent/supabase-server';
import { embed as defaultEmbed } from '@/lib/agent/embeddings';
import { handleUpsert } from '@/lib/agent/knowledge-upsert';

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
