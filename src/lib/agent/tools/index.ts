import type { SupabaseClient } from '@supabase/supabase-js';
import { buscarProducto, listarProductos } from './productos';
import { buscarOrden } from './ordenes';
import { knowledgeBase } from './knowledge';

export const TOOL_DEFS = [
  {
    name: 'buscar_producto',
    description: 'Busca la ficha completa de un producto y sus variables/opciones. Pasá el término tal cual lo dijo el cliente (ej: "camisas", "lonas").',
    input_schema: { type: 'object' as const, properties: { termino: { type: 'string', description: 'término del producto tal como lo dijo el cliente' } }, required: ['termino'] },
  },
  {
    name: 'listar_productos',
    description: 'Lista productos disponibles. Categorías: Papelería, Señalética, Promocionales, Reconocimientos, Técnicas. Pasá null para todas. NO usar para responder con listas al cliente.',
    input_schema: { type: 'object' as const, properties: { categoria: { type: ['string', 'null'], description: 'categoría o null para todas' } }, required: ['categoria'] },
  },
  {
    name: 'buscar_orden',
    description: 'Busca una orden por número (formato ORD-YYMMDD-NNN). Devuelve estado, producto, cantidad, cliente y fechas.',
    input_schema: { type: 'object' as const, properties: { numero: { type: 'string', description: 'número de la orden' } }, required: ['numero'] },
  },
  {
    name: 'knowledge_base',
    description: 'Información general de Hidasol (empresa, ubicación, políticas). Si no hay respuesta clara, hacé handoff.',
    input_schema: { type: 'object' as const, properties: { pregunta: { type: 'string', description: 'la pregunta del cliente' } }, required: ['pregunta'] },
    cache_control: { type: 'ephemeral' as const },
  },
];

export async function runTool(name: string, input: any, client: SupabaseClient): Promise<any> {
  switch (name) {
    case 'buscar_producto': return buscarProducto(client, input.termino);
    case 'listar_productos': return listarProductos(client, input.categoria ?? null);
    case 'buscar_orden': return buscarOrden(client, input.numero);
    case 'knowledge_base': return knowledgeBase(client, input.pregunta);
    default: throw new Error(`Tool desconocida: ${name}`);
  }
}
