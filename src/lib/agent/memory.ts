import type { SupabaseClient } from '@supabase/supabase-js';

export interface MemMessage { role: 'user' | 'assistant'; content: string; }

export async function loadMemory(client: SupabaseClient, contactId: string, limit = 20): Promise<MemMessage[]> {
  const { data, error } = await client
    .from('agent_messages')
    .select('role, content')
    .eq('contact_id', contactId)
    .order('id', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`loadMemory: ${error.message}`);
  return (data ?? [])
    .filter((r: any) => r.role === 'user' || r.role === 'assistant')
    .map((r: any) => ({ role: r.role, content: r.content?.text ?? '' }));
}

export async function saveTurn(client: SupabaseClient, contactId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const { error } = await client.from('agent_messages').insert({ contact_id: contactId, role, content: { text: content } });
  if (error) throw new Error(`saveTurn: ${error.message}`);
}
