import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnthropic } from './llm';
import { TOOL_DEFS, runTool as defaultRunTool } from './tools';
import type { MemMessage } from './memory';

interface RunParams {
  contactId: string;
  userText: string;
  systemPrompt: string;
  model: string;
  temperature?: number;
  history: MemMessage[];
  client: SupabaseClient;
  deps?: { anthropic?: any; runTool?: typeof defaultRunTool };
}

const MAX_TURNS = 6;

export async function runAgent(params: RunParams): Promise<{ output: string; toolsUsed: string[]; tokensIn: number; tokensOut: number }> {
  const anthropic = params.deps?.anthropic ?? getAnthropic();
  const runTool = params.deps?.runTool ?? defaultRunTool;

  const messages: any[] = [
    ...params.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: params.userText },
  ];
  const system = [{ type: 'text', text: params.systemPrompt, cache_control: { type: 'ephemeral' } }];

  const toolsUsed: string[] = [];
  let tokensIn = 0;
  let tokensOut = 0;
  let output = '';

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await anthropic.messages.create({
      model: params.model,
      max_tokens: 1024,
      temperature: params.temperature ?? 0,
      system,
      tools: TOOL_DEFS,
      messages,
    });
    tokensIn += res.usage?.input_tokens ?? 0;
    tokensOut += res.usage?.output_tokens ?? 0;

    if (res.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: res.content });
      const toolResults: any[] = [];
      for (const block of res.content) {
        if (block.type === 'tool_use') {
          toolsUsed.push(block.name);
          let result: any;
          try {
            result = await runTool(block.name, block.input, params.client);
          } catch (e: any) {
            result = { error: e.message };
          }
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result ?? null) });
        }
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // end_turn (o cualquier otro): juntar el texto final
    output = res.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim();
    break;
  }

  return { output, toolsUsed, tokensIn, tokensOut };
}
