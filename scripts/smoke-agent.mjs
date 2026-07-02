import Anthropic from '@anthropic-ai/sdk';

const a = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const r = await a.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 50,
  system: [{ type: 'text', text: 'Respondé en una línea, en español.' }],
  messages: [{ role: 'user', content: 'decime hola' }],
});
console.log('Claude:', r.content.find((b) => b.type === 'text')?.text);
