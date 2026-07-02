import type { SupabaseClient } from '@supabase/supabase-js';

export async function buscarOrden(client: SupabaseClient, numero: string): Promise<any[]> {
  const { data, error } = await client
    .from('orders')
    .select('order_id, cliente, producto_nombre, cantidad, estado, fecha_ingreso, fecha_entrega')
    .ilike('order_id', `%${numero}%`)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw new Error(`buscar_orden: ${error.message}`);
  return data ?? [];
}
