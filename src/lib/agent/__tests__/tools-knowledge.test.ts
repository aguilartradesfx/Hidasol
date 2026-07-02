import { describe, it, expect, vi } from 'vitest';
import { knowledgeBase } from '@/lib/agent/tools/knowledge';

describe('knowledgeBase', () => {
  it('embebe la pregunta y llama match_documents', async () => {
    const embed = vi.fn(async () => [0.1, 0.2]);
    const rpc = vi.fn(async () => ({ data: [{ content: 'Estamos en San Carlos', similarity: 0.9 }], error: null }));
    const r = await knowledgeBase({ rpc } as any, '¿dónde están?', { embed });
    expect(embed).toHaveBeenCalledWith('¿dónde están?');
    expect(rpc).toHaveBeenCalledWith('match_documents', { query_embedding: [0.1, 0.2], match_count: 4, filter: {} });
    expect(r).toEqual([{ content: 'Estamos en San Carlos', similarity: 0.9 }]);
  });
});
