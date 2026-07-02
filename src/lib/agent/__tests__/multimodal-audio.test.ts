import { describe, it, expect, vi } from 'vitest';
import { transcribeAudio } from '@/lib/agent/multimodal';

describe('transcribeAudio', () => {
  it('descarga el audio y lo transcribe con whisper-1 en es', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob([new Uint8Array([1, 2, 3])]), { status: 200 }));
    const create = vi.fn(async () => ({ text: 'hola quiero una lona' }));
    const openai = { audio: { transcriptions: { create } } } as any;
    const out = await transcribeAudio('https://x/y.ogg', { fetch: fetchMock as any, openai });
    expect(fetchMock).toHaveBeenCalledWith('https://x/y.ogg');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'whisper-1', language: 'es' }));
    expect(out).toBe('hola quiero una lona');
  });
});
