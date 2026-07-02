import { embed as defaultEmbed } from '@/lib/agent/embeddings';

export interface Deps { client: any; embed: typeof defaultEmbed; }

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
