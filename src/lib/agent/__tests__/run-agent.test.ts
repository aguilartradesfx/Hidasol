import { describe, it, expect, vi } from 'vitest';
import { runAgent } from '@/lib/agent/run-agent';

describe('runAgent', () => {
  it('ejecuta la tool pedida y devuelve el texto final', async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'buscar_producto', input: { termino: 'lonas' } }],
        usage: { input_tokens: 10, output_tokens: 5 },
      })
      .mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'En lonas manejamos varias medidas 😊' }],
        usage: { input_tokens: 20, output_tokens: 8 },
      });
    const anthropic = { messages: { create } } as any;
    const runTool = vi.fn(async () => ({ producto: 'Lona', variables: {} }));
    const r = await runAgent({
      contactId: 'C1', userText: '¿qué lonas tienen?', systemPrompt: 'Sos el asistente.',
      model: 'claude-sonnet-4-5-20250929', history: [], client: {} as any,
      deps: { anthropic, runTool },
    });
    expect(runTool).toHaveBeenCalledWith('buscar_producto', { termino: 'lonas' }, expect.anything());
    expect(r.output).toBe('En lonas manejamos varias medidas 😊');
    expect(r.toolsUsed).toEqual(['buscar_producto']);
    expect(r.tokensIn).toBe(30); // 10 + 20
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('sin tools, devuelve el texto directo', async () => {
    const create = vi.fn().mockResolvedValueOnce({
      stop_reason: 'end_turn', content: [{ type: 'text', text: '¡Hola! ¿Cómo te ayudo?' }],
      usage: { input_tokens: 5, output_tokens: 4 },
    });
    const r = await runAgent({
      contactId: 'C1', userText: 'hola', systemPrompt: 'S', model: 'm', history: [], client: {} as any,
      deps: { anthropic: { messages: { create } } as any, runTool: vi.fn() },
    });
    expect(r.output).toBe('¡Hola! ¿Cómo te ayudo?');
    expect(r.toolsUsed).toEqual([]);
  });
});
