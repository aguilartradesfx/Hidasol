import { claimBuffer } from '@/lib/agent/buffer';
import { getBotConfig } from '@/lib/agent/config';
import { loadMemory, saveTurn } from '@/lib/agent/memory';
import { runAgent } from '@/lib/agent/run-agent';
import { parseAgentOutput } from '@/lib/agent/output-parser';
import { rowsToText } from '@/lib/agent/multimodal';
import { executeAction } from '@/lib/agent/actions';

export async function logAgent(client: any, row: any): Promise<void> {
  await client.from('agent_logs').insert(row);
}

export interface Deps {
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
  // Kill switch global: si el bot está apagado, NO reclamamos ni enviamos nada.
  // (El webhook ya bloquea la ingesta, pero esto cubre mensajes ya en buffer + el cron.)
  const cfg = await deps.getBotConfig(deps.client);
  if (!cfg.botEnabled) return { status: 200, body: { contact_id: contactId, skipped: 'bot off' } };

  const rows = await deps.claimBuffer(deps.client, contactId);
  if (rows.length === 0) return { status: 200, body: { contact_id: contactId, claimed: 0 } };

  const userText = await deps.rowsToText(rows);
  // Guard: mensajes vacíos (eventos de GHL sin texto, recibos, etc.) no se mandan al agente
  // (Anthropic rechaza contenido vacío → 500). No hay nada a qué responder.
  if (!userText.trim()) return { status: 200, body: { contact_id: contactId, claimed: rows.length, skipped: 'empty' } };

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
