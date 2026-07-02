import { describe, it, expect, vi } from 'vitest';
import { buscarProducto, listarProductos } from '@/lib/agent/tools/productos';
import { buscarOrden } from '@/lib/agent/tools/ordenes';

describe('tools db', () => {
  it('buscarProducto llama al RPC con producto_nombre', async () => {
    const rpc = vi.fn(async () => ({ data: { producto: 'Lona' }, error: null }));
    const r = await buscarProducto({ rpc } as any, 'lonas');
    expect(rpc).toHaveBeenCalledWith('buscar_producto', { producto_nombre: 'lonas' });
    expect(r).toEqual({ producto: 'Lona' });
  });
  it('listarProductos pasa categoria (o null)', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    await listarProductos({ rpc } as any, null);
    expect(rpc).toHaveBeenCalledWith('listar_productos', { categoria_nombre: null });
  });
  it('buscarOrden filtra por order_id ilike y limita 5', async () => {
    const limit = vi.fn(async () => ({ data: [{ order_id: 'ORD-1' }], error: null }));
    const order = vi.fn(() => ({ limit }));
    const ilike = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ ilike }));
    const from = vi.fn(() => ({ select }));
    const r = await buscarOrden({ from } as any, '1');
    expect(from).toHaveBeenCalledWith('orders');
    expect(ilike).toHaveBeenCalledWith('order_id', '%1%');
    expect(r).toEqual([{ order_id: 'ORD-1' }]);
  });
});
