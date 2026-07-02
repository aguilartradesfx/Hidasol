import { NextRequest, NextResponse } from 'next/server';
import { claimBuffer } from '@/lib/agent/buffer';
import { getBotConfig } from '@/lib/agent/config';
import { loadMemory, saveTurn } from '@/lib/agent/memory';
import { runAgent } from '@/lib/agent/run-agent';
import { parseAgentOutput } from '@/lib/agent/output-parser';
import { rowsToText } from '@/lib/agent/multimodal';
import { executeAction } from '@/lib/agent/actions';
import { getServiceClient } from '@/lib/agent/supabase-server';

export const maxDuration = 300;

export async function logAgent(client: any, row: any): Promise<void> {
  await client.from('agent_logs').insert(row);
}

interface Deps {
  client: any;
  claimBuffer: typeof claimBuffer;
  rowsToText: typeof rowsToText;
  getBotConfig: typeof getBotConfig;
  loadMemory: typeof loadMemory;
  saveTurn: typeof saveTurn;
  runAgent: typeof runAgent;
  executeAction: typeof executeAction;
  logAgent: typeof logAgent;
}

export async function handleProcess(contactId: string, deps: Deps): Promise<{ status: number; body: any }> {
  const rows = await deps.claimBuffer(deps.client, contactId);
  if (rows.length === 0) return { status: 200, body: { contact_id: contactId, claimed: 0 } };

  const userText = await deps.rowsToText(rows);
  const cfg = await deps.getBotConfig(deps.client);
  const history = await deps.loadMemory(deps.client, contactId);
  const run = await deps.runAgent({ contactId, userText, systemPrompt: cfg.systemPrompt, model: cfg.model, temperature: cfg.temperature, history, client: deps.client });
  const parsed = parseAgentOutput(run.output, contactId);
  const result = await deps.executeAction(parsed, { client: deps.client, contactId });

  await deps.saveTurn(deps.client, contactId, 'user', userText);
  await deps.saveTurn(deps.client, contactId, 'assistant', run.output);
  await deps.logAgent(deps.client, {
    contact_id: contactId, input: userText, output: run.output, action: result.action,
    tools_used: run.toolsUsed, tokens_in: run.tokensIn, tokens_out: run.tokensOut,
  });

  return { status: 200, body: { contact_id: contactId, claimed: rows.length, tipo: parsed.tipo, action: result.action, orderId: result.orderId } };
}

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
