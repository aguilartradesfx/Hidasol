import { describe, it, expect, vi } from 'vitest';
import { executeAction } from '@/lib/agent/actions';

function ctx(over: any = {}) {
  return {
    client: {} as any, contactId: 'C1',
    sendMessage: vi.fn(async () => {}),
    addTag: vi.fn(async () => {}),
    crearOrden: vi.fn(async () => 'ORD-260701-001'),
    setBotOff: vi.fn(async () => {}),
    ...over,
  };
}

describe('executeAction', () => {
  it('mensaje → envía', async () => {
    const c = ctx();
    await executeAction({ tipo: 'mensaje', contact_id: 'C1', agent_response: 'Hola' }, c);
    expect(c.sendMessage).toHaveBeenCalledWith('C1', 'Hola');
  });
  it('handoff → envía + tags human handoff y bot_desactivado + apaga sesión', async () => {
    const c = ctx();
    await executeAction({ tipo: 'handoff', contact_id: 'C1', agent_response: 'Te paso' }, c);
    expect(c.sendMessage).toHaveBeenCalledWith('C1', 'Te paso');
    expect(c.addTag).toHaveBeenCalledWith('C1', 'human handoff');
    expect(c.addTag).toHaveBeenCalledWith('C1', 'bot_desactivado');
    expect(c.setBotOff).toHaveBeenCalledWith(c.client, 'C1');
  });
  it('orden_completa → crea orden y confirma con el número', async () => {
    const c = ctx();
    const r = await executeAction({ tipo: 'orden_completa', contact_id: 'C1', orden: { cliente: 'Ana' } }, c);
    expect(c.crearOrden).toHaveBeenCalledWith(c.client, 'C1', { cliente: 'Ana' });
    expect(c.sendMessage).toHaveBeenCalledWith('C1', expect.stringContaining('ORD-260701-001'));
    expect(r.orderId).toBe('ORD-260701-001');
  });
});
