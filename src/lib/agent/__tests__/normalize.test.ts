import { describe, it, expect } from 'vitest';
import { normalizeGhlPayload } from '@/lib/agent/normalize';

describe('normalizeGhlPayload', () => {
  it('extrae texto básico', () => {
    const r = normalizeGhlPayload({ customData: { contact_id: 'C1', message: 'Hola', name: 'Ana', phone: '7000', email: 'a@a.co', channel: 'Whatsapp' } });
    expect(r).toEqual({ contactId: 'C1', text: 'Hola', type: 'text', mediaUrl: null, name: 'Ana', phone: '7000', email: 'a@a.co', channel: 'Whatsapp' });
  });
  it('detecta audio por extensión de media_url', () => {
    const r = normalizeGhlPayload({ customData: { contact_id: 'C1', message: '', media_url: 'https://x/y.ogg' } });
    expect(r.type).toBe('audio');
    expect(r.mediaUrl).toBe('https://x/y.ogg');
  });
  it('detecta imagen por extensión', () => {
    const r = normalizeGhlPayload({ customData: { contact_id: 'C1', media_url: 'https://x/y.jpg' } });
    expect(r.type).toBe('image');
  });
  it('lanza si falta contact_id', () => {
    expect(() => normalizeGhlPayload({ customData: {} })).toThrow(/contact_id/);
  });
});
