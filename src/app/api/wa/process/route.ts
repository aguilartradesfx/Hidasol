import { NextRequest, NextResponse } from 'next/server';
import { claimBuffer } from '@/lib/agent/buffer';
import { getBotConfig } from '@/lib/agent/config';
import { loadMemory, saveTurn } from '@/lib/agent/memory';
import { runAgent } from '@/lib/agent/run-agent';
import { rowsToText } from '@/lib/agent/multimodal';
import { executeAction } from '@/lib/agent/actions';
import { getServiceClient } from '@/lib/agent/supabase-server';
import { handleProcess, logAgent } from '@/lib/agent/process-handler';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (req.headers.get('x-process-secret') !== process.env.PROCESS_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { contact_id } = await req.json().catch(() => ({}));
  if (!contact_id) return NextResponse.json({ error: 'falta contact_id' }, { status: 400 });
  const client = getServiceClient();
  const res = await handleProcess(contact_id, { client, claimBuffer, rowsToText, getBotConfig, loadMemory, saveTurn, runAgent, executeAction, logAgent });
  return NextResponse.json(res.body, { status: res.status });
}
