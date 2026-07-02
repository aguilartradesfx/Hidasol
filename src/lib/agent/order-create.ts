import type { SupabaseClient } from '@supabase/supabase-js';

export async function crearOrden(client: SupabaseClient, contactId: string, orden: any): Promise<string> {
  const { data, error } = await client.rpc('crear_orden_bot', { p: { contact_id: contactId, orden } });
  if (error) throw new Error(`crear_orden_bot: ${error.message}`);
  return data as string;
}
