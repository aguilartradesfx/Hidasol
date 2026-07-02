import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedOutput } from './output-parser';
import { sendMessage as defaultSend, addTag as defaultAddTag } from './ghl-actions';
import { crearOrden as defaultCrear } from './order-create';

export async function setBotOff(client: SupabaseClient, contactId: string): Promise<void> {
  const { error } = await client.from('sessions').update({ estado_bot: 'off' }).eq('contact_id', contactId);
  if (error) throw new Error(`setBotOff: ${error.message}`);
}

interface Ctx {
  client: SupabaseClient;
  contactId: string;
  sendMessage?: typeof defaultSend;
  addTag?: typeof defaultAddTag;
  crearOrden?: typeof defaultCrear;
  setBotOff?: typeof setBotOff;
}

export async function executeAction(parsed: ParsedOutput, ctx: Ctx): Promise<{ action: string; orderId?: string }> {
  const send = ctx.sendMessage ?? defaultSend;
  const tag = ctx.addTag ?? defaultAddTag;
  const crear = ctx.crearOrden ?? defaultCrear;
  const off = ctx.setBotOff ?? setBotOff;
  const cid = ctx.contactId;

  if (parsed.tipo === 'orden_completa') {
    const orderId = await crear(ctx.client, cid, parsed.orden);
    await send(cid, `Listo! En breve alguien del equipo te contacta con el precio. Tu número de orden es ${orderId}. Guardalo para consultar el estado cuando quieras.`);
    return { action: 'orden_completa', orderId };
  }
  if (parsed.tipo === 'handoff') {
    await send(cid, parsed.agent_response ?? '');
    await tag(cid, 'human handoff');
    await tag(cid, 'bot_desactivado');
    await off(ctx.client, cid);
    return { action: 'handoff' };
  }
  if (parsed.tipo === 'producto_especial') {
    await send(cid, parsed.agent_response ?? '');
    await tag(cid, 'producto especial');
    return { action: 'producto_especial' };
  }
  await send(cid, parsed.agent_response ?? '');
  return { action: 'mensaje' };
}
