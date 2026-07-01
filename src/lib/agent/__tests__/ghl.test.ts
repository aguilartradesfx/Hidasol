import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContact } from '@/lib/agent/ghl';

beforeEach(() => { process.env.GHL_TOKEN = 'tok'; });

describe('getContact', () => {
  it('devuelve tags y datos del contacto', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ contact: { tags: ['a', 'bot_desactivado'], firstName: 'Ana', phone: '7000', email: 'a@a.co' } }), { status: 200 })) as any;
    const r = await getContact('C1');
    expect(r.tags).toContain('bot_desactivado');
    expect(r.phone).toBe('7000');
  });
  it('devuelve tags vacíos si GHL falla', async () => {
    globalThis.fetch = vi.fn(async () => new Response('err', { status: 500 })) as any;
    const r = await getContact('C1');
    expect(r.tags).toEqual([]);
  });
});
