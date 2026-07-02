import type { SupabaseClient } from '@supabase/supabase-js';
import { embed as defaultEmbed } from '../embeddings';

export async function knowledgeBase(
  client: SupabaseClient,
  pregunta: string,
  deps: { embed?: typeof defaultEmbed } = {},
): Promise<any[]> {
  const embed = deps.embed ?? defaultEmbed;
  const query_embedding = await embed(pregunta);
  const { data, error } = await client.rpc('match_documents', { query_embedding, match_count: 4, filter: {} });
  if (error) throw new Error(`match_documents: ${error.message}`);
  return data ?? [];
}
