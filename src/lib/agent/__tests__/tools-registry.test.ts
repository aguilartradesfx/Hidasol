import { describe, it, expect, vi } from 'vitest';
import { TOOL_DEFS, runTool } from '@/lib/agent/tools';

describe('tools registry', () => {
  it('expone las 4 tools con input_schema', () => {
    const names = TOOL_DEFS.map((t) => t.name).sort();
    expect(names).toEqual(['buscar_orden', 'buscar_producto', 'knowledge_base', 'listar_productos']);
    for (const t of TOOL_DEFS) expect(t.input_schema.type).toBe('object');
  });
  it('runTool despacha buscar_producto', async () => {
    const rpc = vi.fn(async () => ({ data: { producto: 'Lona' }, error: null }));
    const r = await runTool('buscar_producto', { termino: 'lonas' }, { rpc } as any);
    expect(rpc).toHaveBeenCalledWith('buscar_producto', { producto_nombre: 'lonas' });
    expect(r).toEqual({ producto: 'Lona' });
  });
  it('runTool lanza en tool desconocida', async () => {
    await expect(runTool('nope', {}, {} as any)).rejects.toThrow(/desconocida/);
  });
});
