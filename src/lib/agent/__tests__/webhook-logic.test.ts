import { describe, it, expect, vi } from 'vitest';
import { handleWebhook } from '@/app/api/wa/webhook/route';

const baseDeps = () => ({
  getContact: vi.fn(async (): Promise<{ tags: string[]; name: string | null; phone: string | null; email: string | null }> => ({ tags: [], name: 'Ana', phone: '7000', email: null })),
  getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'X', model: 'm', temperature: 0 })),
  insertBufferMessage: vi.fn(async () => {}),
  client: {} as any,
});

describe('handleWebhook', () => {
  it('bufferea cuando el bot está habilitado', async () => {
    const deps = baseDeps();
    const res = await handleWebhook({ customData: { contact_id: 'C1', message: 'Hola' } }, deps);
    expect(res.status).toBe(200);
    expect(deps.insertBufferMessage).toHaveBeenCalled();
  });
  it('NO bufferea si el contacto tiene bot_desactivado', async () => {
    const deps = baseDeps();
    deps.getContact = vi.fn(async () => ({ tags: ['bot_desactivado'], name: null, phone: null, email: null }));
    const res = await handleWebhook({ customData: { contact_id: 'C1', message: 'Hola' } }, deps);
    expect(res.status).toBe(200);
    expect(deps.insertBufferMessage).not.toHaveBeenCalled();
  });
  it('responde 400 si el payload es inválido', async () => {
    const deps = baseDeps();
    const res = await handleWebhook({ customData: {} }, deps);
    expect(res.status).toBe(400);
  });
});
