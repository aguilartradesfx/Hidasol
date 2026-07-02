import { describe, it, expect, vi } from 'vitest';
import { getBotConfig, setBotEnabled, setContactBot, upsertProducto } from '@/lib/admin-store';

describe('admin-store', () => {
  it('getBotConfig lee la fila 1', async () => {
    const maybeSingle = vi.fn(async () => ({ data: { bot_enabled: true, system_prompt: 'X' }, error: null }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = { from: () => ({ select }) } as any;
    expect(await getBotConfig(client)).toEqual({ botEnabled: true, systemPrompt: 'X' });
  });
  it('setBotEnabled actualiza bot_config', async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: () => ({ update }) } as any;
    await setBotEnabled(false, 'Admin', client);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ bot_enabled: false, updated_by: 'Admin' }));
  });
  it('setContactBot mapea on/off a estado_bot idle/off', async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: () => ({ update }) } as any;
    await setContactBot('C1', false, client);
    expect(update).toHaveBeenCalledWith({ estado_bot: 'off' });
  });
  it('upsertProducto hace upsert', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ upsert }) } as any;
    await upsertProducto({ id: 'p1', producto: 'Lona' }, client);
    expect(upsert).toHaveBeenCalledWith({ id: 'p1', producto: 'Lona' });
  });
});
