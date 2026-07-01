import { describe, it, expect, vi } from 'vitest';
import { handleProcess } from '@/app/api/wa/process/route';

describe('handleProcess', () => {
  it('reclama el buffer y reporta cuántos mensajes tomó', async () => {
    const claimBuffer = vi.fn(async () => [{ message: 'Hola', message_type: 'text', media_url: null, created_at: 't' }]);
    const res = await handleProcess('C1', { claimBuffer, client: {} as any });
    expect(claimBuffer).toHaveBeenCalledWith(expect.anything(), 'C1');
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 1 });
  });
  it('no-op si no hay mensajes', async () => {
    const claimBuffer = vi.fn(async () => []);
    const res = await handleProcess('C1', { claimBuffer, client: {} as any });
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 0 });
  });
});
