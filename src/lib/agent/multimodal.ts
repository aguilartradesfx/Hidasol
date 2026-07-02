import OpenAI, { toFile } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic } from './llm';

let cachedOpenai: OpenAI | null = null;
function openaiClient(): OpenAI {
  if (!cachedOpenai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    cachedOpenai = new OpenAI({ apiKey });
  }
  return cachedOpenai;
}

export async function transcribeAudio(
  mediaUrl: string,
  deps: { fetch?: typeof fetch; openai?: OpenAI } = {},
): Promise<string> {
  const doFetch = deps.fetch ?? fetch;
  const openai = deps.openai ?? openaiClient();
  const res = await doFetch(mediaUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = await toFile(buf, 'audio.ogg');
  const tr = await openai.audio.transcriptions.create({ model: 'whisper-1', file, language: 'es' });
  return tr.text;
}

const IMG_PROMPT =
  'Describe brevemente qué se ve en la imagen, enfocándote en si se relaciona con productos de imprenta/rotulación (lonas, banners, tarjetas, rótulos, stickers, etc.). Máximo 2 frases.';

export async function describeImage(
  mediaUrl: string,
  deps: { fetch?: typeof fetch; anthropic?: Anthropic } = {},
): Promise<string> {
  const doFetch = deps.fetch ?? fetch;
  const anthropic = deps.anthropic ?? getAnthropic();
  const res = await doFetch(mediaUrl);
  const media_type = res.headers.get('content-type') || 'image/jpeg';
  const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type, data: b64 } },
        { type: 'text', text: IMG_PROMPT },
      ],
    }],
  });
  return msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ').trim();
}
