import OpenAI from 'openai';

let cached: OpenAI | null = null;
function client(): OpenAI {
  if (!cached) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    cached = new OpenAI({ apiKey });
  }
  return cached;
}

export async function embed(text: string, deps: { client?: OpenAI } = {}): Promise<number[]> {
  const c = deps.client ?? client();
  const res = await c.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding as number[];
}
