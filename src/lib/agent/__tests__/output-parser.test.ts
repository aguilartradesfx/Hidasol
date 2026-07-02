import { describe, it, expect } from 'vitest';
import { parseAgentOutput } from '@/lib/agent/output-parser';

describe('parseAgentOutput', () => {
  it('detecta ORDEN_COMPLETA y parsea el JSON', () => {
    const out = 'Ya tengo todo 😊\nORDEN_COMPLETA:\n{ "producto_nombre": "Lona", "cantidad": "2" }';
    const r = parseAgentOutput(out, 'C1');
    expect(r.tipo).toBe('orden_completa');
    expect(r.orden).toEqual({ producto_nombre: 'Lona', cantidad: '2' });
    expect(r.contact_id).toBe('C1');
  });
  it('ORDEN_COMPLETA con JSON inválido cae a mensaje', () => {
    const r = parseAgentOutput('ORDEN_COMPLETA: { roto', 'C1');
    expect(r.tipo).toBe('mensaje');
  });
  it('detecta [HANDOFF] y limpia el tag', () => {
    const r = parseAgentOutput('Te paso con alguien 😊 [HANDOFF]', 'C1');
    expect(r.tipo).toBe('handoff');
    expect(r.agent_response).toBe('Te paso con alguien 😊');
  });
  it('detecta [PRODUCTO_ESPECIAL]', () => {
    const r = parseAgentOutput('Eso es personalizado [PRODUCTO_ESPECIAL]', 'C1');
    expect(r.tipo).toBe('producto_especial');
    expect(r.agent_response).toBe('Eso es personalizado');
  });
  it('texto normal → mensaje', () => {
    const r = parseAgentOutput('¿Cuántas querés?', 'C1');
    expect(r).toEqual({ tipo: 'mensaje', agent_response: '¿Cuántas querés?', contact_id: 'C1' });
  });
});
