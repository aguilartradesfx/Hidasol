import type { NormalizedMessage } from './types';

const AUDIO_EXT = /\.(ogg|oga|mp3|m4a|wav|amr|opus)(\?|$)/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|heic)(\?|$)/i;

export function normalizeGhlPayload(body: any): NormalizedMessage {
  const c = body?.customData ?? body ?? {};
  const contactId = c.contact_id;
  if (!contactId) throw new Error('normalizeGhlPayload: falta contact_id');
  const mediaUrl: string | null = c.media_url || null;
  let type: NormalizedMessage['type'] = 'text';
  if (mediaUrl && AUDIO_EXT.test(mediaUrl)) type = 'audio';
  else if (mediaUrl && IMAGE_EXT.test(mediaUrl)) type = 'image';
  return {
    contactId: String(contactId),
    text: c.message ?? '',
    type,
    mediaUrl,
    name: c.name ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
    channel: c.channel ?? 'Whatsapp',
  };
}
