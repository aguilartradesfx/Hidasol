import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, addTag } from '@/lib/agent/ghl-actions';

beforeEach(() => { process.env.GHL_TOKEN = 'tok'; });

describe('ghl actions', () => {
  it('sendMessage postea a /conversations/messages con el body correcto', async () => {
    const fetchMock = vi.fn(async (_url: any, _opts: any) => new Response('{}', { status: 201 }));
    globalThis.fetch = fetchMock as any;
    await sendMessage('C1', 'Hola');
    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://services.leadconnectorhq.com/conversations/messages');
    expect(JSON.parse(opts.body)).toEqual({ type: 'WhatsApp', contactId: 'C1', message: 'Hola' });
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });
  it('addTag postea a /contacts/{id}/tags', async () => {
    const fetchMock = vi.fn(async (_url: any, _opts: any) => new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as any;
    await addTag('C1', 'bot_desactivado');
    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://services.leadconnectorhq.com/contacts/C1/tags');
    expect(JSON.parse(opts.body)).toEqual({ tags: ['bot_desactivado'] });
  });
  it('sendMessage lanza si GHL responde error', async () => {
    globalThis.fetch = vi.fn(async () => new Response('err', { status: 500 })) as any;
    await expect(sendMessage('C1', 'x')).rejects.toThrow(/GHL/);
  });
});
