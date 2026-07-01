import { describe, it, expect } from 'vitest';
import { getBotConfig } from '@/lib/agent/config';

function mockClient(row: any) {
  return { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }) } as any;
}

describe('getBotConfig', () => {
  it('mapea la fila de bot_config', async () => {
    const cfg = await getBotConfig(mockClient({ bot_enabled: true, system_prompt: 'X', model: 'claude-sonnet-4-5-20250929', temperature: 0 }));
    expect(cfg).toEqual({ botEnabled: true, systemPrompt: 'X', model: 'claude-sonnet-4-5-20250929', temperature: 0 });
  });
  it('devuelve default apagado si no hay fila', async () => {
    const cfg = await getBotConfig(mockClient(null));
    expect(cfg.botEnabled).toBe(false);
  });
});
