import { describe, it, expect, vi } from 'vitest';
import { crearOrden } from '@/lib/agent/order-create';

describe('crearOrden', () => {
  it('llama a crear_orden_bot con el payload y devuelve el order_id', async () => {
    const rpc = vi.fn(async () => ({ data: 'ORD-260701-001', error: null }));
    const id = await crearOrden({ rpc } as any, 'C1', { cliente: 'Ana', producto_nombre: 'Lona' });
    expect(rpc).toHaveBeenCalledWith('crear_orden_bot', { p: { contact_id: 'C1', orden: { cliente: 'Ana', producto_nombre: 'Lona' } } });
    expect(id).toBe('ORD-260701-001');
  });
  it('lanza si hay error', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
    await expect(crearOrden({ rpc } as any, 'C1', {})).rejects.toThrow(/crear_orden_bot/);
  });
});
