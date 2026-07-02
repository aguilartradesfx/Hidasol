import { describe, it, expect, vi } from 'vitest';
import { handleProcess } from '@/app/api/wa/process/route';

function deps(over: any = {}) {
  return {
    client: {} as any,
    claimBuffer: vi.fn(async () => [{ message: '¿qué lonas tienen?', message_type: 'text', media_url: null, created_at: 't' }]),
    getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'S', model: 'm', temperature: 0 })),
    loadMemory: vi.fn(async () => []),
    saveTurn: vi.fn(async () => {}),
    runAgent: vi.fn(async () => ({ output: 'En lonas manejamos varias 😊', toolsUsed: ['buscar_producto'], tokensIn: 30, tokensOut: 8 })),
    logAgent: vi.fn(async () => {}),
    ...over,
  };
}

describe('handleProcess (con agente)', () => {
  it('corre el agente y persiste memoria + log', async () => {
    const d = deps();
    const res = await handleProcess('C1', d);
    expect(d.runAgent).toHaveBeenCalled();
    expect(d.runAgent.mock.calls[0][0]).toMatchObject({ temperature: 0 });
    expect(d.saveTurn).toHaveBeenCalledWith(d.client, 'C1', 'user', '¿qué lonas tienen?');
    expect(d.saveTurn).toHaveBeenCalledWith(d.client, 'C1', 'assistant', 'En lonas manejamos varias 😊');
    expect(d.logAgent).toHaveBeenCalled();
    expect(res.body).toMatchObject({ contact_id: 'C1', claimed: 1, tipo: 'mensaje', output: 'En lonas manejamos varias 😊' });
  });
  it('pasa la temperature de la config al agente', async () => {
    const d = deps({ getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'S', model: 'm', temperature: 0.7 })) });
    await handleProcess('C1', d);
    expect(d.runAgent.mock.calls[0][0]).toMatchObject({ temperature: 0.7 });
  });
  it('no-op si el buffer está vacío', async () => {
    const d = deps({ claimBuffer: vi.fn(async () => []) });
    const res = await handleProcess('C1', d);
    expect(d.runAgent).not.toHaveBeenCalled();
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 0 });
  });
});
