export interface ParsedOutput {
  tipo: 'mensaje' | 'orden_completa' | 'handoff' | 'producto_especial';
  contact_id: string;
  agent_response?: string;
  orden?: any;
}

export function parseAgentOutput(output: string, contactId: string): ParsedOutput {
  if (output.indexOf('ORDEN_COMPLETA') !== -1) {
    const start = output.indexOf('{');
    const end = output.lastIndexOf('}') + 1;
    try {
      return { tipo: 'orden_completa', orden: JSON.parse(output.substring(start, end)), contact_id: contactId };
    } catch {
      return { tipo: 'mensaje', agent_response: output, contact_id: contactId };
    }
  }
  if (output.indexOf('[PRODUCTO_ESPECIAL]') !== -1) {
    return { tipo: 'producto_especial', agent_response: output.replace('[PRODUCTO_ESPECIAL]', '').trim(), contact_id: contactId };
  }
  if (output.indexOf('[HANDOFF]') !== -1) {
    return { tipo: 'handoff', agent_response: output.replace('[HANDOFF]', '').trim(), contact_id: contactId };
  }
  return { tipo: 'mensaje', agent_response: output, contact_id: contactId };
}
