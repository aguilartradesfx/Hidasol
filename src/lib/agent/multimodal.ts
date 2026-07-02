import OpenAI, { toFile } from 'openai';

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
