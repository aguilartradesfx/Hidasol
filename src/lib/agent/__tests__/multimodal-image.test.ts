import { describe, it, expect, vi } from 'vitest';
import { describeImage } from '@/lib/agent/multimodal';

describe('describeImage', () => {
  it('descarga la imagen y pide a Claude una descripción', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob([new Uint8Array([1, 2, 3])]), { status: 200, headers: { 'content-type': 'image/jpeg' } }));
    const create = vi.fn(async () => ({ content: [{ type: 'text', text: 'Una lona con logo' }] }));
    const anthropic = { messages: { create } } as any;
    const out = await describeImage('https://x/y.jpg', { fetch: fetchMock as any, anthropic });
    expect(fetchMock).toHaveBeenCalledWith('https://x/y.jpg');
    expect(create).toHaveBeenCalled();
    const arg = create.mock.calls[0][0];
    expect(arg.messages[0].content.some((b: any) => b.type === 'image')).toBe(true);
    expect(out).toBe('Una lona con logo');
  });
});
