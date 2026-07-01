import { NextRequest, NextResponse } from 'next/server';
import { normalizeGhlPayload } from '@/lib/agent/normalize';
import { getContact } from '@/lib/agent/ghl';
import { getBotConfig } from '@/lib/agent/config';
import { insertBufferMessage } from '@/lib/agent/buffer';
import { isBotEnabledFor } from '@/lib/agent/gate';
import { getServiceClient } from '@/lib/agent/supabase-server';

interface Deps {
  getContact: typeof getContact;
  getBotConfig: typeof getBotConfig;
  insertBufferMessage: typeof insertBufferMessage;
  client: any;
}

export async function handleWebhook(body: any, deps: Deps): Promise<{ status: number; body: any }> {
  let msg;
  try {
    msg = normalizeGhlPayload(body);
  } catch {
    return { status: 400, body: { error: 'payload inválido' } };
  }
  const [contact, cfg] = await Promise.all([deps.getContact(msg.contactId), deps.getBotConfig(deps.client)]);
  const enabled = isBotEnabledFor({ globalEnabled: cfg.botEnabled, tags: contact.tags, estadoBot: null });
  if (!enabled) return { status: 200, body: { skipped: 'bot off' } };
  const enriched = { ...msg, name: msg.name ?? contact.name, phone: msg.phone ?? contact.phone, email: msg.email ?? contact.email };
  await deps.insertBufferMessage(deps.client, enriched);
  return { status: 200, body: { buffered: true } };
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-wa-secret') !== process.env.WA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const client = getServiceClient();
  const res = await handleWebhook(body, { getContact, getBotConfig, insertBufferMessage, client });
  return NextResponse.json(res.body, { status: res.status });
}
