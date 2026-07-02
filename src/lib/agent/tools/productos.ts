import type { SupabaseClient } from '@supabase/supabase-js';

export async function buscarProducto(client: SupabaseClient, termino: string): Promise<any> {
  const { data, error } = await client.rpc('buscar_producto', { producto_nombre: termino });
  if (error) throw new Error(`buscar_producto: ${error.message}`);
  return data;
}

export async function listarProductos(client: SupabaseClient, categoria: string | null): Promise<any> {
  const { data, error } = await client.rpc('listar_productos', { categoria_nombre: categoria });
  if (error) throw new Error(`listar_productos: ${error.message}`);
  return data;
}
