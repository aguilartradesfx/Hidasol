import { describe, it, expect, vi } from 'vitest';
import { insertBufferMessage, claimBuffer } from '@/lib/agent/buffer';

describe('buffer', () => {
  it('insertBufferMessage manda processed=false', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ insert }) } as any;
    await insertBufferMessage(client, { contactId: 'C1', text: 'Hola', type: 'text', mediaUrl: null, name: 'Ana', phone: '7000', email: null, channel: 'Whatsapp' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ contact_id: 'C1', message: 'Hola', processed: false }));
  });

  it('claimBuffer devuelve filas reclamadas', async () => {
    const rows = [{ message: 'Hola', message_type: '1', media_url: null, created_at: 't' }];
    const select = vi.fn(async () => ({ data: rows, error: null }));
    const eq2 = vi.fn(() => ({ select }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const client = { from: () => ({ update }) } as any;
    const out = await claimBuffer(client, 'C1');
    expect(update).toHaveBeenCalledWith({ processed: true });
    expect(out).toEqual(rows);
  });
});
