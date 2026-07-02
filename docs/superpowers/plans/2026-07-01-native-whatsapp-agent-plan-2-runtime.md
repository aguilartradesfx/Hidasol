# Agente WhatsApp Nativo — Plan 2: Runtime del Agente

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que dado el texto del cliente + su sesión + config, el agente (Claude Sonnet 4.5 con tool use) genere una respuesta usando las tools SQL y el RAG, parsee la salida por tags, y persista memoria + log — todo cableado en `/api/wa/process`. NO envía a GHL todavía (eso es Plan 3).

**Architecture:** Un loop de tool-use con el SDK de Anthropic. Las tools llaman a Supabase (RPC/PostgREST) y a OpenAI (embeddings para RAG). Memoria en `agent_messages`. La salida se parsea a `{tipo: mensaje|orden_completa|handoff|producto_especial}`. `/api/wa/process` orquesta: claim buffer → correr agente → persistir → log.

**Tech Stack:** `@anthropic-ai/sdk`, `openai`, `@supabase/supabase-js` (service key), Vitest.

## Global Constraints

- Modelo: `claude-sonnet-4-5-20250929`. Embeddings: OpenAI `text-embedding-3-small` (1536 dims) — DEBE coincidir con `knowledge_chunks.embedding vector(1536)`.
- Supabase desde server: service key vía `getServiceClient()` (Plan 1). Nunca conexión directa.
- Secrets solo de env: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (ya validadas y en `.env.local`).
- **Prompt caching** en el system prompt y las definiciones de tools (bloques estáticos) para bajar costo.
- Funciones SQL existentes (firmas reales): `buscar_producto(producto_nombre text)→jsonb`, `listar_productos(categoria_nombre text)→jsonb`, `match_documents(query_embedding vector, match_count int, filter jsonb)→TABLE(id,content,metadata,similarity)`. `buscar_orden` NO es función: es query sobre `orders`.
- El system prompt del agente sale de `bot_config.system_prompt` (Plan 1). Sus tags de salida: `[HANDOFF]`, `[PRODUCTO_ESPECIAL]`, `ORDEN_COMPLETA: {json}`.
- Este plan NO envía por GHL ni crea órdenes (Plan 3). `/process` devuelve la respuesta en el body para poder testear.
- TDD, commits por tarea, rama `feat/agente-nativo`.

---

## File Structure

- Create `src/lib/agent/llm.ts` — factory del cliente Anthropic.
- Create `src/lib/agent/embeddings.ts` — `embed(text): Promise<number[]>` (OpenAI 1536).
- Create `src/lib/agent/output-parser.ts` — `parseAgentOutput(text, contactId)` (pura).
- Create `src/lib/agent/tools/productos.ts` — `buscarProducto`, `listarProductos`.
- Create `src/lib/agent/tools/ordenes.ts` — `buscarOrden`.
- Create `src/lib/agent/tools/knowledge.ts` — `knowledgeBase`.
- Create `src/lib/agent/tools/index.ts` — `TOOL_DEFS` (schema Anthropic) + `runTool(name,input,client)`.
- Create `src/lib/agent/memory.ts` — `loadMemory`, `saveTurn`.
- Create `src/lib/agent/run-agent.ts` — `runAgent(params)` (loop tool-use).
- Modify `src/app/api/wa/process/route.ts` — reemplazar el TODO con el agente.

---

### Task 1: Dependencias (SDKs)

**Files:** Modify `package.json`

- [ ] **Step 1: Instalar**

```bash
npm install @anthropic-ai/sdk@^0.32 openai@^4
```

- [ ] **Step 2: Verificar que resuelven**

Run: `node -e "require.resolve('@anthropic-ai/sdk'); require.resolve('openai'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Correr la suite (sin regresiones)**

Run: `npm test`
Expected: 21 passing (Plan 1 intacto).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(agent): add anthropic + openai SDKs"
```

---

### Task 2: Embeddings (OpenAI)

**Files:** Create `src/lib/agent/embeddings.ts`, Test `src/lib/agent/__tests__/embeddings.test.ts`

**Interfaces:**
- Produces: `embed(text: string, deps?: { client?: OpenAI }): Promise<number[]>` — usa `text-embedding-3-small`, devuelve el vector (1536).

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/embeddings.test.ts
import { describe, it, expect, vi } from 'vitest';
import { embed } from '@/lib/agent/embeddings';

describe('embed', () => {
  it('devuelve el vector del primer embedding', async () => {
    const create = vi.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] }));
    const client = { embeddings: { create } } as any;
    const v = await embed('hola', { client });
    expect(create).toHaveBeenCalledWith({ model: 'text-embedding-3-small', input: 'hola' });
    expect(v).toEqual([0.1, 0.2, 0.3]);
  });
});
```

- [ ] **Step 2: Correr → FAIL** — `npx vitest run src/lib/agent/__tests__/embeddings.test.ts`

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/embeddings.ts
import OpenAI from 'openai';

let cached: OpenAI | null = null;
function client(): OpenAI {
  if (!cached) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    cached = new OpenAI({ apiKey });
  }
  return cached;
}

export async function embed(text: string, deps: { client?: OpenAI } = {}): Promise<number[]> {
  const c = deps.client ?? client();
  const res = await c.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding as number[];
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): OpenAI embeddings (1536)`

---

### Task 3: Parser de salida (puro)

**Files:** Create `src/lib/agent/output-parser.ts`, Test `src/lib/agent/__tests__/output-parser.test.ts`

**Interfaces:**
- Produces: `parseAgentOutput(output: string, contactId: string): { tipo: 'mensaje'|'orden_completa'|'handoff'|'producto_especial'; contact_id: string; agent_response?: string; orden?: any }`. Porta la lógica del nodo n8n `Parse Agent Output`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/output-parser.test.ts
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
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar** (porta el code node de n8n)

```typescript
// src/lib/agent/output-parser.ts
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
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): output tag parser`

---

### Task 4: Tools de productos y órdenes

**Files:** Create `src/lib/agent/tools/productos.ts`, `src/lib/agent/tools/ordenes.ts`, Test `src/lib/agent/__tests__/tools-db.test.ts`

**Interfaces:**
- Produces:
  - `buscarProducto(client, termino: string): Promise<any>` → `client.rpc('buscar_producto', { producto_nombre: termino })`.
  - `listarProductos(client, categoria: string | null): Promise<any>` → `client.rpc('listar_productos', { categoria_nombre: categoria })`.
  - `buscarOrden(client, numero: string): Promise<any[]>` → query sobre `orders` (ilike, limit 5).

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/tools-db.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buscarProducto, listarProductos } from '@/lib/agent/tools/productos';
import { buscarOrden } from '@/lib/agent/tools/ordenes';

describe('tools db', () => {
  it('buscarProducto llama al RPC con producto_nombre', async () => {
    const rpc = vi.fn(async () => ({ data: { producto: 'Lona' }, error: null }));
    const r = await buscarProducto({ rpc } as any, 'lonas');
    expect(rpc).toHaveBeenCalledWith('buscar_producto', { producto_nombre: 'lonas' });
    expect(r).toEqual({ producto: 'Lona' });
  });
  it('listarProductos pasa categoria (o null)', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    await listarProductos({ rpc } as any, null);
    expect(rpc).toHaveBeenCalledWith('listar_productos', { categoria_nombre: null });
  });
  it('buscarOrden filtra por order_id ilike y limita 5', async () => {
    const limit = vi.fn(async () => ({ data: [{ order_id: 'ORD-1' }], error: null }));
    const order = vi.fn(() => ({ limit }));
    const ilike = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ ilike }));
    const from = vi.fn(() => ({ select }));
    const r = await buscarOrden({ from } as any, '1');
    expect(from).toHaveBeenCalledWith('orders');
    expect(ilike).toHaveBeenCalledWith('order_id', '%1%');
    expect(r).toEqual([{ order_id: 'ORD-1' }]);
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/tools/productos.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function buscarProducto(client: SupabaseClient, termino: string): Promise<any> {
  const { data, error } = await client.rpc('buscar_producto', { producto_nombre: termino });
  if (error) throw new Error(`buscar_producto: ${error.message}`);
  return data;
}

export async function listarProductos(client: SupabaseClient, categoria: string | null): Promise<any> {
  const { data, error } = await client.rpc('listar_productos', { categoria_nombre: categoria });
  if (error) throw new Error(`listar_productos: ${error.message}`);
  return data;
}
```

```typescript
// src/lib/agent/tools/ordenes.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function buscarOrden(client: SupabaseClient, numero: string): Promise<any[]> {
  const { data, error } = await client
    .from('orders')
    .select('order_id, cliente, producto_nombre, cantidad, estado, fecha_ingreso, fecha_entrega')
    .ilike('order_id', `%${numero}%`)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw new Error(`buscar_orden: ${error.message}`);
  return data ?? [];
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): productos + ordenes tools`

---

### Task 5: Tool de conocimiento (RAG)

**Files:** Create `src/lib/agent/tools/knowledge.ts`, Test `src/lib/agent/__tests__/tools-knowledge.test.ts`

**Interfaces:**
- Produces: `knowledgeBase(client, pregunta, deps?: { embed })` — embed la pregunta (OpenAI 1536) → `client.rpc('match_documents', { query_embedding, match_count: 4, filter: {} })` → devuelve los chunks.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/tools-knowledge.test.ts
import { describe, it, expect, vi } from 'vitest';
import { knowledgeBase } from '@/lib/agent/tools/knowledge';

describe('knowledgeBase', () => {
  it('embebe la pregunta y llama match_documents', async () => {
    const embed = vi.fn(async () => [0.1, 0.2]);
    const rpc = vi.fn(async () => ({ data: [{ content: 'Estamos en San Carlos', similarity: 0.9 }], error: null }));
    const r = await knowledgeBase({ rpc } as any, '¿dónde están?', { embed });
    expect(embed).toHaveBeenCalledWith('¿dónde están?');
    expect(rpc).toHaveBeenCalledWith('match_documents', { query_embedding: [0.1, 0.2], match_count: 4, filter: {} });
    expect(r).toEqual([{ content: 'Estamos en San Carlos', similarity: 0.9 }]);
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/tools/knowledge.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { embed as defaultEmbed } from '../embeddings';

export async function knowledgeBase(
  client: SupabaseClient,
  pregunta: string,
  deps: { embed?: typeof defaultEmbed } = {},
): Promise<any[]> {
  const embed = deps.embed ?? defaultEmbed;
  const query_embedding = await embed(pregunta);
  const { data, error } = await client.rpc('match_documents', { query_embedding, match_count: 4, filter: {} });
  if (error) throw new Error(`match_documents: ${error.message}`);
  return data ?? [];
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): RAG knowledge_base tool`

---

### Task 6: Registro y dispatcher de tools

**Files:** Create `src/lib/agent/tools/index.ts`, Test `src/lib/agent/__tests__/tools-registry.test.ts`

**Interfaces:**
- Produces:
  - `TOOL_DEFS`: array de definiciones de tool para Anthropic (`{ name, description, input_schema }`), con caché: la última lleva `cache_control`.
  - `runTool(name: string, input: any, client: SupabaseClient): Promise<any>` — despacha al ejecutor correcto.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/tools-registry.test.ts
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
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/tools/index.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { buscarProducto, listarProductos } from './productos';
import { buscarOrden } from './ordenes';
import { knowledgeBase } from './knowledge';

export const TOOL_DEFS = [
  {
    name: 'buscar_producto',
    description: 'Busca la ficha completa de un producto y sus variables/opciones. Pasá el término tal cual lo dijo el cliente (ej: "camisas", "lonas").',
    input_schema: { type: 'object' as const, properties: { termino: { type: 'string', description: 'término del producto tal como lo dijo el cliente' } }, required: ['termino'] },
  },
  {
    name: 'listar_productos',
    description: 'Lista productos disponibles. Categorías: Papelería, Señalética, Promocionales, Reconocimientos, Técnicas. Pasá null para todas. NO usar para responder con listas al cliente.',
    input_schema: { type: 'object' as const, properties: { categoria: { type: ['string', 'null'], description: 'categoría o null para todas' } }, required: ['categoria'] },
  },
  {
    name: 'buscar_orden',
    description: 'Busca una orden por número (formato ORD-YYMMDD-NNN). Devuelve estado, producto, cantidad, cliente y fechas.',
    input_schema: { type: 'object' as const, properties: { numero: { type: 'string', description: 'número de la orden' } }, required: ['numero'] },
  },
  {
    name: 'knowledge_base',
    description: 'Información general de Hidasol (empresa, ubicación, políticas). Si no hay respuesta clara, hacé handoff.',
    input_schema: { type: 'object' as const, properties: { pregunta: { type: 'string', description: 'la pregunta del cliente' } }, required: ['pregunta'] },
    cache_control: { type: 'ephemeral' as const },
  },
];

export async function runTool(name: string, input: any, client: SupabaseClient): Promise<any> {
  switch (name) {
    case 'buscar_producto': return buscarProducto(client, input.termino);
    case 'listar_productos': return listarProductos(client, input.categoria ?? null);
    case 'buscar_orden': return buscarOrden(client, input.numero);
    case 'knowledge_base': return knowledgeBase(client, input.pregunta);
    default: throw new Error(`Tool desconocida: ${name}`);
  }
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): tool registry + dispatcher`

---

### Task 7: Memoria de conversación

**Files:** Create `src/lib/agent/memory.ts`, Test `src/lib/agent/__tests__/memory.test.ts`

**Interfaces:**
- Produces:
  - `loadMemory(client, contactId, limit=20): Promise<Array<{ role: 'user'|'assistant'; content: string }>>` — lee `agent_messages` en orden (id asc), mapea a mensajes Anthropic (solo user/assistant).
  - `saveTurn(client, contactId, role, content): Promise<void>` — inserta en `agent_messages`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/memory.test.ts
import { describe, it, expect, vi } from 'vitest';
import { loadMemory, saveTurn } from '@/lib/agent/memory';

describe('memory', () => {
  it('loadMemory mapea filas a mensajes user/assistant', async () => {
    const rows = [
      { role: 'user', content: { text: 'hola' } },
      { role: 'assistant', content: { text: 'buenas' } },
      { role: 'tool', content: { x: 1 } },
    ];
    const limit = vi.fn(async () => ({ data: rows, error: null }));
    const order = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const client = { from: () => ({ select }) } as any;
    const mem = await loadMemory(client, 'C1');
    expect(mem).toEqual([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'buenas' },
    ]);
  });
  it('saveTurn inserta rol y content', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ insert }) } as any;
    await saveTurn(client, 'C1', 'user', 'hola');
    expect(insert).toHaveBeenCalledWith({ contact_id: 'C1', role: 'user', content: { text: 'hola' } });
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/memory.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MemMessage { role: 'user' | 'assistant'; content: string; }

export async function loadMemory(client: SupabaseClient, contactId: string, limit = 20): Promise<MemMessage[]> {
  const { data, error } = await client
    .from('agent_messages')
    .select('role, content')
    .eq('contact_id', contactId)
    .order('id', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`loadMemory: ${error.message}`);
  return (data ?? [])
    .filter((r: any) => r.role === 'user' || r.role === 'assistant')
    .map((r: any) => ({ role: r.role, content: r.content?.text ?? '' }));
}

export async function saveTurn(client: SupabaseClient, contactId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const { error } = await client.from('agent_messages').insert({ contact_id: contactId, role, content: { text: content } });
  if (error) throw new Error(`saveTurn: ${error.message}`);
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): conversation memory (agent_messages)`

---

### Task 8: Loop del agente (Claude + tool use)

**Files:** Create `src/lib/agent/llm.ts`, `src/lib/agent/run-agent.ts`, Test `src/lib/agent/__tests__/run-agent.test.ts`

**Interfaces:**
- Produces:
  - `getAnthropic(): Anthropic` (factory, lee `ANTHROPIC_API_KEY`).
  - `runAgent(params: { contactId, userText, systemPrompt, model, history, client, deps? }): Promise<{ output: string; toolsUsed: string[]; tokensIn: number; tokensOut: number }>` — corre el loop: llama al modelo con `TOOL_DEFS`; mientras devuelva `tool_use`, ejecuta `runTool` y reinyecta `tool_result`; termina cuando el modelo da texto final. `deps.anthropic` y `deps.runTool` son inyectables para test.

- [ ] **Step 1: Test que falla (mock del cliente Anthropic simulando 1 vuelta de tool)**

```typescript
// src/lib/agent/__tests__/run-agent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { runAgent } from '@/lib/agent/run-agent';

describe('runAgent', () => {
  it('ejecuta la tool pedida y devuelve el texto final', async () => {
    const create = vi.fn()
      .mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'buscar_producto', input: { termino: 'lonas' } }],
        usage: { input_tokens: 10, output_tokens: 5 },
      })
      .mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'En lonas manejamos varias medidas 😊' }],
        usage: { input_tokens: 20, output_tokens: 8 },
      });
    const anthropic = { messages: { create } } as any;
    const runTool = vi.fn(async () => ({ producto: 'Lona', variables: {} }));
    const r = await runAgent({
      contactId: 'C1', userText: '¿qué lonas tienen?', systemPrompt: 'Sos el asistente.',
      model: 'claude-sonnet-4-5-20250929', history: [], client: {} as any,
      deps: { anthropic, runTool },
    });
    expect(runTool).toHaveBeenCalledWith('buscar_producto', { termino: 'lonas' }, expect.anything());
    expect(r.output).toBe('En lonas manejamos varias medidas 😊');
    expect(r.toolsUsed).toEqual(['buscar_producto']);
    expect(r.tokensIn).toBe(30); // 10 + 20
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('sin tools, devuelve el texto directo', async () => {
    const create = vi.fn().mockResolvedValueOnce({
      stop_reason: 'end_turn', content: [{ type: 'text', text: '¡Hola! ¿Cómo te ayudo?' }],
      usage: { input_tokens: 5, output_tokens: 4 },
    });
    const r = await runAgent({
      contactId: 'C1', userText: 'hola', systemPrompt: 'S', model: 'm', history: [], client: {} as any,
      deps: { anthropic: { messages: { create } } as any, runTool: vi.fn() },
    });
    expect(r.output).toBe('¡Hola! ¿Cómo te ayudo?');
    expect(r.toolsUsed).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar el factory**

```typescript
// src/lib/agent/llm.ts
import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (!cached) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY');
    cached = new Anthropic({ apiKey });
  }
  return cached;
}
```

- [ ] **Step 4: Implementar el loop**

```typescript
// src/lib/agent/run-agent.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnthropic } from './llm';
import { TOOL_DEFS, runTool as defaultRunTool } from './tools';
import type { MemMessage } from './memory';

interface RunParams {
  contactId: string;
  userText: string;
  systemPrompt: string;
  model: string;
  history: MemMessage[];
  client: SupabaseClient;
  deps?: { anthropic?: any; runTool?: typeof defaultRunTool };
}

const MAX_TURNS = 6;

export async function runAgent(params: RunParams): Promise<{ output: string; toolsUsed: string[]; tokensIn: number; tokensOut: number }> {
  const anthropic = params.deps?.anthropic ?? getAnthropic();
  const runTool = params.deps?.runTool ?? defaultRunTool;

  const messages: any[] = [
    ...params.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: params.userText },
  ];
  const system = [{ type: 'text', text: params.systemPrompt, cache_control: { type: 'ephemeral' } }];

  const toolsUsed: string[] = [];
  let tokensIn = 0;
  let tokensOut = 0;
  let output = '';

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await anthropic.messages.create({
      model: params.model,
      max_tokens: 1024,
      system,
      tools: TOOL_DEFS,
      messages,
    });
    tokensIn += res.usage?.input_tokens ?? 0;
    tokensOut += res.usage?.output_tokens ?? 0;

    if (res.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: res.content });
      const toolResults: any[] = [];
      for (const block of res.content) {
        if (block.type === 'tool_use') {
          toolsUsed.push(block.name);
          let result: any;
          try {
            result = await runTool(block.name, block.input, params.client);
          } catch (e: any) {
            result = { error: e.message };
          }
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result ?? null) });
        }
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // end_turn (o cualquier otro): juntar el texto final
    output = res.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim();
    break;
  }

  return { output, toolsUsed, tokensIn, tokensOut };
}
```

- [ ] **Step 5: Correr → PASS**. **Step 6: `npx tsc --noEmit`** limpio. **Step 7: Commit** `feat(agent): Claude tool-use loop`

---

### Task 9: Cablear el agente en `/api/wa/process`

**Files:** Modify `src/app/api/wa/process/route.ts`, Test `src/lib/agent/__tests__/process-agent.test.ts`

**Interfaces:**
- `handleProcess(contactId, deps)` pasa a: claim buffer → si vacío no-op → juntar texto → cargar config + memoria → `runAgent` → `parseAgentOutput` → guardar turnos (user + assistant) + `agent_log` → devolver `{ contact_id, claimed, tipo, output }`. NO envía a GHL (Plan 3). Todo por deps inyectables.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/process-agent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleProcess } from '@/app/api/wa/process/route';

function deps(over: any = {}) {
  return {
    client: {} as any,
    claimBuffer: vi.fn(async () => [{ message: '¿qué lonas tienen?', message_type: 'text', media_url: null, created_at: 't' }]),
    getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'S', model: 'm', temperature: 0 })),
    loadMemory: vi.fn(async () => []),
    saveTurn: vi.fn(async () => {}),
    runAgent: vi.fn(async () => ({ output: 'En lonas manejamos varias 😊', toolsUsed: ['buscar_producto'], tokensIn: 30, tokensOut: 8 })),
    logAgent: vi.fn(async () => {}),
    ...over,
  };
}

describe('handleProcess (con agente)', () => {
  it('corre el agente y persiste memoria + log', async () => {
    const d = deps();
    const res = await handleProcess('C1', d);
    expect(d.runAgent).toHaveBeenCalled();
    expect(d.saveTurn).toHaveBeenCalledWith(d.client, 'C1', 'user', '¿qué lonas tienen?');
    expect(d.saveTurn).toHaveBeenCalledWith(d.client, 'C1', 'assistant', 'En lonas manejamos varias 😊');
    expect(d.logAgent).toHaveBeenCalled();
    expect(res.body).toMatchObject({ contact_id: 'C1', claimed: 1, tipo: 'mensaje', output: 'En lonas manejamos varias 😊' });
  });
  it('no-op si el buffer está vacío', async () => {
    const d = deps({ claimBuffer: vi.fn(async () => []) });
    const res = await handleProcess('C1', d);
    expect(d.runAgent).not.toHaveBeenCalled();
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 0 });
  });
}); 
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar** (reemplaza el esqueleto; conserva el wrapper POST + `maxDuration`)

```typescript
// src/app/api/wa/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { claimBuffer } from '@/lib/agent/buffer';
import { getBotConfig } from '@/lib/agent/config';
import { loadMemory, saveTurn } from '@/lib/agent/memory';
import { runAgent } from '@/lib/agent/run-agent';
import { parseAgentOutput } from '@/lib/agent/output-parser';
import { getServiceClient } from '@/lib/agent/supabase-server';

export const maxDuration = 300;

interface Deps {
  client: any;
  claimBuffer: typeof claimBuffer;
  getBotConfig: typeof getBotConfig;
  loadMemory: typeof loadMemory;
  saveTurn: typeof saveTurn;
  runAgent: typeof runAgent;
  logAgent: (client: any, row: any) => Promise<void>;
}

export async function logAgent(client: any, row: any): Promise<void> {
  await client.from('agent_logs').insert(row);
}

export async function handleProcess(contactId: string, deps: Deps): Promise<{ status: number; body: any }> {
  const rows = await deps.claimBuffer(deps.client, contactId);
  if (rows.length === 0) return { status: 200, body: { contact_id: contactId, claimed: 0 } };

  const userText = rows.map((r: any) => r.message).filter(Boolean).join('\n').trim();
  const cfg = await deps.getBotConfig(deps.client);
  const history = await deps.loadMemory(deps.client, contactId);

  const run = await deps.runAgent({
    contactId, userText, systemPrompt: cfg.systemPrompt, model: cfg.model, history, client: deps.client,
  });
  const parsed = parseAgentOutput(run.output, contactId);

  await deps.saveTurn(deps.client, contactId, 'user', userText);
  await deps.saveTurn(deps.client, contactId, 'assistant', run.output);
  await deps.logAgent(deps.client, {
    contact_id: contactId, input: userText, output: run.output, action: parsed.tipo,
    tools_used: run.toolsUsed, tokens_in: run.tokensIn, tokens_out: run.tokensOut,
  });

  return { status: 200, body: { contact_id: contactId, claimed: rows.length, tipo: parsed.tipo, output: run.output } };
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-process-secret') !== process.env.PROCESS_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { contact_id } = await req.json().catch(() => ({}));
  if (!contact_id) return NextResponse.json({ error: 'falta contact_id' }, { status: 400 });
  const client = getServiceClient();
  const res = await handleProcess(contact_id, { client, claimBuffer, getBotConfig, loadMemory, saveTurn, runAgent, logAgent });
  return NextResponse.json(res.body, { status: res.status });
}
```

- [ ] **Step 4: Correr → PASS** (`process-agent.test.ts` + suite completa). **Step 5: `npx tsc --noEmit`** limpio. **Step 6: Commit** `feat(agent): wire Claude agent into /api/wa/process`

---

### Task 10: Prueba real del agente (1 corrida contra Anthropic)

**Files:** Create `scripts/smoke-agent.mjs`

**Interfaces:** ninguna (valida el loop real con las llaves de `.env.local`).

- [ ] **Step 1: Script**

```javascript
// scripts/smoke-agent.mjs — corre el agente de verdad contra Anthropic + Supabase (lee .env.local)
import 'dotenv/config';
import { getServiceClient } from '../src/lib/agent/supabase-server.ts';
```
> Nota: como el proyecto es Next/TS, en vez de importar TS desde node, este smoke se hace vía el endpoint desplegado (Plan 5) o con `tsx`. Para validar el loop YA, usar el test unitario de Task 8 (mockeado) + esta llamada mínima real:

```javascript
// scripts/smoke-agent.mjs
import Anthropic from '@anthropic-ai/sdk';
const a = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const r = await a.messages.create({
  model: 'claude-sonnet-4-5-20250929', max_tokens: 50,
  system: [{ type: 'text', text: 'Respondé en una línea, en español.' }],
  messages: [{ role: 'user', content: 'decime hola' }],
});
console.log('Claude:', r.content.find((b) => b.type === 'text')?.text);
```

- [ ] **Step 2: Correr** (con env cargado): `node -r dotenv/config scripts/smoke-agent.mjs dotenv_config_path=.env.local`
Expected: una línea de Claude en español.

- [ ] **Step 3: Commit** `test(agent): smoke script for live Claude call`

---

## Self-Review (cobertura vs spec §6)

- Loop Claude + tool use: Task 8. ✓
- Tools SQL (buscar_producto/listar_productos/buscar_orden): Task 4 + 6. ✓
- RAG knowledge_base (embed + match_documents 1536): Task 5. ✓
- Prompt caching (system + tools): Task 8 (system `cache_control`) + Task 6 (última tool `cache_control`). ✓
- Memoria (agent_messages): Task 7. ✓
- Parser de tags: Task 3. ✓
- Integración en /process (sin enviar): Task 9. ✓
- **Fuera de alcance (Plan 3):** enviar por GHL, crear orden desde `ORDEN_COMPLETA`, multimodal (audio/imagen), handoff con apagado. `/process` devuelve `output`/`tipo` para test; no actúa hacia afuera.
- **Placeholder scan:** Task 10 depende de deploy/tsx para el smoke completo (documentado); el loop real se valida por el unit test mockeado + la llamada mínima directa a Anthropic. Sin otros placeholders.
