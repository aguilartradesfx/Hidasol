import { NextRequest, NextResponse } from 'next/server';
import { claimBuffer } from '@/lib/agent/buffer';
import { getServiceClient } from '@/lib/agent/supabase-server';

export const maxDuration = 300;

interface Deps { claimBuffer: typeof claimBuffer; client: any; }

export async function handleProcess(contactId: string, deps: Deps): Promise<{ status: number; body: any }> {
  const rows = await deps.claimBuffer(deps.client, contactId);
  // TODO (Plan 2): correr el agente sobre `rows`. Por ahora solo reclama + reporta.
  return { status: 200, body: { contact_id: contactId, claimed: rows.length } };
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-process-secret') !== process.env.PROCESS_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { contact_id } = await req.json().catch(() => ({}));
  if (!contact_id) return NextResponse.json({ error: 'falta contact_id' }, { status: 400 });
  const client = getServiceClient();
  const res = await handleProcess(contact_id, { claimBuffer, client });
  return NextResponse.json(res.body, { status: res.status });
}
