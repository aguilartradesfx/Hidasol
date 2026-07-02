import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!cached) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY');
    cached = new Anthropic({ apiKey });
  }
  return cached;
}
