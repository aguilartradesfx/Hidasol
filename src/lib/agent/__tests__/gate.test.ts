import { describe, it, expect } from 'vitest';
import { isBotEnabledFor } from '@/lib/agent/gate';

describe('isBotEnabledFor', () => {
  const base = { globalEnabled: true, tags: [] as string[], estadoBot: 'idle' as string | null };
  it('permite cuando todo está habilitado', () => {
    expect(isBotEnabledFor(base)).toBe(true);
  });
  it('bloquea si el global está apagado', () => {
    expect(isBotEnabledFor({ ...base, globalEnabled: false })).toBe(false);
  });
  it('bloquea si el contacto tiene el tag bot_desactivado', () => {
    expect(isBotEnabledFor({ ...base, tags: ['cliente', 'bot_desactivado'] })).toBe(false);
  });
  it('bloquea si estado_bot está en off', () => {
    expect(isBotEnabledFor({ ...base, estadoBot: 'off' })).toBe(false);
  });
  it('es case-insensitive y tolera espacios en tags', () => {
    expect(isBotEnabledFor({ ...base, tags: [' Bot_Desactivado '] })).toBe(false);
  });
});
