import { describe, it, expect, vi } from 'vitest';
import { handleProcess } from '@/lib/agent/process-handler';

function deps(over: any = {}) {
  return {
    client: {} as any,
    claimBuffer: vi.fn(async () => [{ message: 'hola', message_type: 'text', media_url: null, created_at: 't' }]),
    rowsToText: vi.fn(async () => 'hola'),
    getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'S', model: 'm', temperature: 0 })),
    loadMemory: vi.fn(async () => []),
    saveTurn: vi.fn(async () => {}),
    runAgent: vi.fn(async () => ({ output: '¿Cuántas querés?', toolsUsed: [], tokensIn: 5, tokensOut: 4 })),
    executeAction: vi.fn(async () => ({ action: 'mensaje' })),
    logAgent: vi.fn(async () => {}),
    ...over,
  };
}

describe('handleProcess (con acciones)', () => {
  it('preprocesa multimodal, corre el agente y ejecuta la acción', async () => {
    const d = deps();
    const res = await handleProcess('C1', d);
    expect(d.rowsToText).toHaveBeenCalled();
    expect(d.executeAction).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'mensaje' }), expect.objectContaining({ contactId: 'C1' }));
    expect(res.body).toMatchObject({ contact_id: 'C1', claimed: 1, tipo: 'mensaje', action: 'mensaje' });
  });
  it('no-op si el buffer está vacío', async () => {
    const d = deps({ claimBuffer: vi.fn(async () => []) });
    const res = await handleProcess('C1', d);
    expect(d.runAgent).not.toHaveBeenCalled();
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 0 });
  });
});
