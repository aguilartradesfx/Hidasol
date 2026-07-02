import { describe, it, expect, vi } from 'vitest';
import { loadMemory, saveTurn } from '@/lib/agent/memory';

describe('memory', () => {
  it('loadMemory mapea filas a mensajes user/assistant', async () => {
    const rows = [
      { role: 'user', content: { text: 'hola' } },
      { role: 'assistant', content: { text: 'buenas' } },
      { role: 'tool', content: { x: 1 } },
    ];
    const limit = vi.fn(async () => ({ data: rows, error: null }));
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const client = { from: () => ({ select }) } as any;
    const mem = await loadMemory(client, 'C1');
    expect(mem).toEqual([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'buenas' },
    ]);
  });
  it('saveTurn inserta rol y content', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ insert }) } as any;
    await saveTurn(client, 'C1', 'user', 'hola');
    expect(insert).toHaveBeenCalledWith({ contact_id: 'C1', role: 'user', content: { text: 'hola' } });
  });
});
