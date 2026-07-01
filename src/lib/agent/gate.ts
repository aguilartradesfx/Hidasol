import type { GateInput } from './types';

export const OFF_TAG = 'bot_desactivado';
const OFF_ESTADOS = new Set(['off', 'humano', 'apagado']);

export function isBotEnabledFor({ globalEnabled, tags, estadoBot }: GateInput): boolean {
  if (!globalEnabled) return false;
  const hasOffTag = tags.some((t) => t.trim().toLowerCase() === OFF_TAG);
  if (hasOffTag) return false;
  if (estadoBot && OFF_ESTADOS.has(estadoBot.trim().toLowerCase())) return false;
  return true;
}
