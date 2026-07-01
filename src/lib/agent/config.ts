import type { SupabaseClient } from '@supabase/supabase-js';
import type { BotConfig } from './types';

export async function getBotConfig(client: SupabaseClient): Promise<BotConfig> {
  const { data, error } = await client.from('bot_config').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(`getBotConfig: ${error.message}`);
  if (!data) return { botEnabled: false, systemPrompt: '', model: 'claude-sonnet-4-5-20250929', temperature: 0 };
  return {
    botEnabled: !!data.bot_enabled,
    systemPrompt: data.system_prompt ?? '',
    model: data.model ?? 'claude-sonnet-4-5-20250929',
    temperature: typeof data.temperature === 'number' ? data.temperature : 0,
  };
}
