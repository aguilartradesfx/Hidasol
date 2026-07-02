import { describe, it, expect, vi } from 'vitest';
import { handleUpsert } from '@/app/api/admin/knowledge/route';

describe('handleUpsert (knowledge)', () => {
  it('embebe el contenido y hace upsert con el embedding', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ upsert }) } as any;
    const embed = vi.fn(async () => [0.1, 0.2]);
    const res = await handleUpsert({ contenido: 'Estamos en San Carlos', categoria: 'ubicacion' }, { client, embed });
    expect(embed).toHaveBeenCalledWith('Estamos en San Carlos');
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ contenido: 'Estamos en San Carlos', categoria: 'ubicacion', embedding: [0.1, 0.2] }));
    expect(res.status).toBe(200);
  });
  it('400 si falta contenido', async () => {
    const res = await handleUpsert({ categoria: 'x' }, { client: {} as any, embed: vi.fn() });
    expect(res.status).toBe(400);
  });
});
