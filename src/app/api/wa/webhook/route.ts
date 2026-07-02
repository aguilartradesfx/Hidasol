import { NextRequest, NextResponse } from 'next/server';
import { getContact } from '@/lib/agent/ghl';
import { getBotConfig } from '@/lib/agent/config';
import { insertBufferMessage } from '@/lib/agent/buffer';
import { getServiceClient } from '@/lib/agent/supabase-server';
import { handleWebhook } from '@/lib/agent/webhook-handler';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-wa-secret') !== process.env.WA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const client = getServiceClient();
  const res = await handleWebhook(body, { getContact, getBotConfig, insertBufferMessage, client });
  return NextResponse.json(res.body, { status: res.status });
}
