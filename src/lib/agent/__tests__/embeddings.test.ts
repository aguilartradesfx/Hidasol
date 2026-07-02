import { describe, it, expect, vi } from 'vitest';
import { embed } from '@/lib/agent/embeddings';

describe('embed', () => {
  it('devuelve el vector del primer embedding', async () => {
    const create = vi.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] }));
    const client = { embeddings: { create } } as any;
    const v = await embed('hola', { client });
    expect(create).toHaveBeenCalledWith({ model: 'text-embedding-3-small', input: 'hola' });
    expect(v).toEqual([0.1, 0.2, 0.3]);
  });
});
