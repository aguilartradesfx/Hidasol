import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedMessage } from './types';

export async function insertBufferMessage(client: SupabaseClient, msg: NormalizedMessage): Promise<void> {
  const { error } = await client.from('message_buffer').insert({
    contact_id: msg.contactId,
    message: msg.text,
    media_url: msg.mediaUrl,
    message_type: msg.type === 'audio' ? 'audio' : msg.type === 'image' ? 'image' : 'text',
    name: msg.name,
    phone: msg.phone,
    email: msg.email,
    channel: msg.channel,
    processed: false,
  });
  if (error) throw new Error(`insertBufferMessage: ${error.message}`);
}

export async function claimBuffer(client: SupabaseClient, contactId: string) {
  const { data, error } = await client
    .from('message_buffer')
    .update({ processed: true })
    .eq('contact_id', contactId)
    .eq('processed', false)
    .select('message, message_type, media_url, created_at');
  if (error) throw new Error(`claimBuffer: ${error.message}`);
  return data ?? [];
}
