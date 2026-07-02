import { describe, it, expect, vi } from 'vitest';
import { rowsToText } from '@/lib/agent/multimodal';

describe('rowsToText', () => {
  it('convierte texto, audio e imagen a un solo string', async () => {
    const deps = {
      transcribeAudio: vi.fn(async () => 'transcripción'),
      describeImage: vi.fn(async () => 'una lona'),
    };
    const rows = [
      { message: 'hola', message_type: 'text', media_url: null },
      { message: '', message_type: 'audio', media_url: 'https://x/a.ogg' },
      { message: 'mirá', message_type: 'image', media_url: 'https://x/i.jpg' },
    ];
    const out = await rowsToText(rows, deps as any);
    expect(deps.transcribeAudio).toHaveBeenCalledWith('https://x/a.ogg', undefined);
    expect(out).toBe('hola\ntranscripción\n[Imagen: una lona] mirá');
  });
});
