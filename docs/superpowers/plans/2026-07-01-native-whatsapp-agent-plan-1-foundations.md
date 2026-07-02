# Agente WhatsApp Nativo — Plan 1: Fundaciones + Ingesta

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un mensaje de WhatsApp entrante (vía GHL) se valide, respete el gate on/off, se guarde en `message_buffer`, y sea despertado por `pg_cron` hacia un `/api/wa/process` que reclama el buffer — todo sin LLM todavía.

**Architecture:** API routes de Next.js (App Router) en Vercel + Supabase (PostgREST con service key, sin conexión directa). El debounce lo dispara `pg_cron` + `pg_net` dentro de Supabase. La lógica pura (gate, normalización) se aísla en funciones testeables.

**Tech Stack:** Next.js 14, TypeScript, `@supabase/supabase-js` (server, service key), Vitest (nuevo), `pg_cron`/`pg_net` en Supabase.

## Global Constraints

- Conexión a Supabase desde server: **PostgREST vía `@supabase/supabase-js` con `SUPABASE_SERVICE_KEY`** (nunca conexión directa `db.<ref>.supabase.co`, que es IPv6-only y rompió el bot). Si se necesita SQL crudo, usar el **pooler** `aws-1-us-east-2.pooler.supabase.com:6543`, user `postgres.<ref>`.
- Secretos **solo server-side** (env vars), nunca en el browser ni en git: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GHL_TOKEN`, `WA_WEBHOOK_SECRET`, `PROCESS_SECRET`, `APP_URL`.
- GHL API base: `https://services.leadconnectorhq.com`, header `Version: 2021-07-28`, `Authorization: Bearer <GHL_TOKEN>`.
- Tag de apagado (exacto): `bot_desactivado`. Embeddings del RAG: OpenAI 1536 dims (planes posteriores).
- Modelo del agente (planes posteriores): `claude-sonnet-4-5-20250929`.
- Commits frecuentes, uno por tarea. Rama de trabajo (no `main` directo).

---

## File Structure

- Create `supabase/migrations/20260701_agent_native_foundations.sql` — tablas `bot_config`, `agent_messages`, `agent_logs`; extensiones + cron + seed.
- Create `src/lib/agent/types.ts` — tipos compartidos (`NormalizedMessage`, `BotConfig`, `GateInput`).
- Create `src/lib/agent/gate.ts` — `isBotEnabledFor(input): boolean` (pura).
- Create `src/lib/agent/normalize.ts` — `normalizeGhlPayload(body): NormalizedMessage` (pura).
- Create `src/lib/agent/supabase-server.ts` — cliente Supabase server (service key).
- Create `src/lib/agent/config.ts` — `getBotConfig()`.
- Create `src/lib/agent/ghl.ts` — `getContact(contactId)`.
- Create `src/lib/agent/buffer.ts` — `insertBufferMessage(...)`, `claimBuffer(contactId)`.
- Create `src/app/api/wa/webhook/route.ts` — POST handler de ingesta.
- Create `src/app/api/wa/process/route.ts` — POST handler (esqueleto: claim + log).
- Create `vitest.config.ts`, tests bajo `src/lib/agent/__tests__/`.
- Modify `package.json` — deps de dev + scripts `test`.

---

### Task 1: Setup de Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/agent/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: comando `npm test` funcionando (Vitest).

- [ ] **Step 1: Instalar Vitest**

```bash
npm install -D vitest@^2
```

- [ ] **Step 2: Crear `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 3: Agregar script de test a `package.json`**

En `"scripts"`, agregar: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Escribir smoke test**

```typescript
// src/lib/agent/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => { it('runs', () => { expect(1 + 1).toBe(2); }); });
```

- [ ] **Step 5: Correr y verificar PASS**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/agent/__tests__/smoke.test.ts
git commit -m "chore: set up Vitest test runner"
```

---

### Task 2: Tipos compartidos + gate on/off (pura)

**Files:**
- Create: `src/lib/agent/types.ts`
- Create: `src/lib/agent/gate.ts`
- Create: `src/lib/agent/__tests__/gate.test.ts`

**Interfaces:**
- Produces:
  - `interface GateInput { globalEnabled: boolean; tags: string[]; estadoBot: string | null }`
  - `function isBotEnabledFor(input: GateInput): boolean`
  - `interface NormalizedMessage { contactId: string; text: string; type: 'text'|'audio'|'image'; mediaUrl: string|null; name: string|null; phone: string|null; email: string|null; channel: string }`
  - `interface BotConfig { botEnabled: boolean; systemPrompt: string; model: string; temperature: number }`

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/lib/agent/__tests__/gate.test.ts
import { describe, it, expect } from 'vitest';
import { isBotEnabledFor } from '@/lib/agent/gate';

describe('isBotEnabledFor', () => {
  const base = { globalEnabled: true, tags: [] as string[], estadoBot: 'idle' as string | null };
  it('permite cuando todo está habilitado', () => {
    expect(isBotEnabledFor(base)).toBe(true);
  });
  it('bloquea si el global está apagado', () => {
    expect(isBotEnabledFor({ ...base, globalEnabled: false })).toBe(false);
  });
  it('bloquea si el contacto tiene el tag bot_desactivado', () => {
    expect(isBotEnabledFor({ ...base, tags: ['cliente', 'bot_desactivado'] })).toBe(false);
  });
  it('bloquea si estado_bot está en off', () => {
    expect(isBotEnabledFor({ ...base, estadoBot: 'off' })).toBe(false);
  });
  it('es case-insensitive y tolera espacios en tags', () => {
    expect(isBotEnabledFor({ ...base, tags: [' Bot_Desactivado '] })).toBe(false);
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/gate.test.ts`
Expected: FAIL ("Cannot find module '@/lib/agent/gate'").

- [ ] **Step 3: Crear tipos**

```typescript
// src/lib/agent/types.ts
export interface NormalizedMessage {
  contactId: string;
  text: string;
  type: 'text' | 'audio' | 'image';
  mediaUrl: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  channel: string;
}
export interface BotConfig {
  botEnabled: boolean;
  systemPrompt: string;
  model: string;
  temperature: number;
}
export interface GateInput {
  globalEnabled: boolean;
  tags: string[];
  estadoBot: string | null;
}
```

- [ ] **Step 4: Implementar el gate**

```typescript
// src/lib/agent/gate.ts
import type { GateInput } from './types';

export const OFF_TAG = 'bot_desactivado';
const OFF_ESTADOS = new Set(['off', 'humano', 'apagado']);

export function isBotEnabledFor({ globalEnabled, tags, estadoBot }: GateInput): boolean {
  if (!globalEnabled) return false;
  const hasOffTag = tags.some((t) => t.trim().toLowerCase() === OFF_TAG);
  if (hasOffTag) return false;
  if (estadoBot && OFF_ESTADOS.has(estadoBot.trim().toLowerCase())) return false;
  return true;
}
```

- [ ] **Step 5: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/gate.test.ts`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/agent/types.ts src/lib/agent/gate.ts src/lib/agent/__tests__/gate.test.ts
git commit -m "feat(agent): bot on/off gate logic"
```

---

### Task 3: Normalizador del payload de GHL (pura)

**Files:**
- Create: `src/lib/agent/normalize.ts`
- Create: `src/lib/agent/__tests__/normalize.test.ts`

**Interfaces:**
- Consumes: `NormalizedMessage` de `types.ts`.
- Produces: `function normalizeGhlPayload(body: any): NormalizedMessage`. El `contact_id` viene en `body.customData.contact_id`; el tipo se deriva de `message_type` (`'1'`=text por default; presencia de `media_url` con extensión de audio → 'audio', imagen → 'image').

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/lib/agent/__tests__/normalize.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeGhlPayload } from '@/lib/agent/normalize';

describe('normalizeGhlPayload', () => {
  it('extrae texto básico', () => {
    const r = normalizeGhlPayload({ customData: { contact_id: 'C1', message: 'Hola', name: 'Ana', phone: '7000', email: 'a@a.co', channel: 'Whatsapp' } });
    expect(r).toEqual({ contactId: 'C1', text: 'Hola', type: 'text', mediaUrl: null, name: 'Ana', phone: '7000', email: 'a@a.co', channel: 'Whatsapp' });
  });
  it('detecta audio por extensión de media_url', () => {
    const r = normalizeGhlPayload({ customData: { contact_id: 'C1', message: '', media_url: 'https://x/y.ogg' } });
    expect(r.type).toBe('audio');
    expect(r.mediaUrl).toBe('https://x/y.ogg');
  });
  it('detecta imagen por extensión', () => {
    const r = normalizeGhlPayload({ customData: { contact_id: 'C1', media_url: 'https://x/y.jpg' } });
    expect(r.type).toBe('image');
  });
  it('lanza si falta contact_id', () => {
    expect(() => normalizeGhlPayload({ customData: {} })).toThrow(/contact_id/);
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/normalize.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/normalize.ts
import type { NormalizedMessage } from './types';

const AUDIO_EXT = /\.(ogg|oga|mp3|m4a|wav|amr|opus)(\?|$)/i;
const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|heic)(\?|$)/i;

export function normalizeGhlPayload(body: any): NormalizedMessage {
  const c = body?.customData ?? body ?? {};
  const contactId = c.contact_id;
  if (!contactId) throw new Error('normalizeGhlPayload: falta contact_id');
  const mediaUrl: string | null = c.media_url || null;
  let type: NormalizedMessage['type'] = 'text';
  if (mediaUrl && AUDIO_EXT.test(mediaUrl)) type = 'audio';
  else if (mediaUrl && IMAGE_EXT.test(mediaUrl)) type = 'image';
  return {
    contactId: String(contactId),
    text: c.message ?? '',
    type,
    mediaUrl,
    name: c.name ?? null,
    phone: c.phone ?? null,
    email: c.email ?? null,
    channel: c.channel ?? 'Whatsapp',
  };
}
```

- [ ] **Step 4: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/normalize.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agent/normalize.ts src/lib/agent/__tests__/normalize.test.ts
git commit -m "feat(agent): normalize GHL webhook payload"
```

---

### Task 4: Cliente Supabase server + lectura de config

**Files:**
- Create: `src/lib/agent/supabase-server.ts`
- Create: `src/lib/agent/config.ts`
- Create: `src/lib/agent/__tests__/config.test.ts`

**Interfaces:**
- Produces:
  - `function getServiceClient(): SupabaseClient` (usa `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`).
  - `async function getBotConfig(client): Promise<BotConfig>` (lee la fila única de `bot_config`; default seguro si no existe).

- [ ] **Step 1: Escribir el test que falla (con cliente mock)**

```typescript
// src/lib/agent/__tests__/config.test.ts
import { describe, it, expect } from 'vitest';
import { getBotConfig } from '@/lib/agent/config';

function mockClient(row: any) {
  return { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }) } as any;
}

describe('getBotConfig', () => {
  it('mapea la fila de bot_config', async () => {
    const cfg = await getBotConfig(mockClient({ bot_enabled: true, system_prompt: 'X', model: 'claude-sonnet-4-5-20250929', temperature: 0 }));
    expect(cfg).toEqual({ botEnabled: true, systemPrompt: 'X', model: 'claude-sonnet-4-5-20250929', temperature: 0 });
  });
  it('devuelve default apagado si no hay fila', async () => {
    const cfg = await getBotConfig(mockClient(null));
    expect(cfg.botEnabled).toBe(false);
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/config.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar el cliente server**

```typescript
// src/lib/agent/supabase-server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}
```

- [ ] **Step 4: Implementar `getBotConfig`**

```typescript
// src/lib/agent/config.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BotConfig } from './types';

export async function getBotConfig(client: SupabaseClient): Promise<BotConfig> {
  const { data, error } = await client.from('bot_config').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(`getBotConfig: ${error.message}`);
  if (!data) return { botEnabled: false, systemPrompt: '', model: 'claude-sonnet-4-5-20250929', temperature: 0 };
  return {
    botEnabled: !!data.bot_enabled,
    systemPrompt: data.system_prompt ?? '',
    model: data.model ?? 'claude-sonnet-4-5-20250929',
    temperature: typeof data.temperature === 'number' ? data.temperature : 0,
  };
}
```

- [ ] **Step 5: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/config.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/agent/supabase-server.ts src/lib/agent/config.ts src/lib/agent/__tests__/config.test.ts
git commit -m "feat(agent): server supabase client + bot_config reader"
```

---

### Task 5: Cliente GHL — getContact

**Files:**
- Create: `src/lib/agent/ghl.ts`
- Create: `src/lib/agent/__tests__/ghl.test.ts`

**Interfaces:**
- Produces: `async function getContact(contactId: string): Promise<{ tags: string[]; name: string|null; phone: string|null; email: string|null }>`. Usa `fetch` a `GET /contacts/{id}` con `GHL_TOKEN`.

- [ ] **Step 1: Escribir el test que falla (con `fetch` mock)**

```typescript
// src/lib/agent/__tests__/ghl.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContact } from '@/lib/agent/ghl';

beforeEach(() => { process.env.GHL_TOKEN = 'tok'; });

describe('getContact', () => {
  it('devuelve tags y datos del contacto', async () => {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ contact: { tags: ['a', 'bot_desactivado'], firstName: 'Ana', phone: '7000', email: 'a@a.co' } }), { status: 200 })) as any;
    const r = await getContact('C1');
    expect(r.tags).toContain('bot_desactivado');
    expect(r.phone).toBe('7000');
  });
  it('devuelve tags vacíos si GHL falla', async () => {
    globalThis.fetch = vi.fn(async () => new Response('err', { status: 500 })) as any;
    const r = await getContact('C1');
    expect(r.tags).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/ghl.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/ghl.ts
const BASE = 'https://services.leadconnectorhq.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GHL_TOKEN}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };
}

export async function getContact(contactId: string): Promise<{ tags: string[]; name: string | null; phone: string | null; email: string | null }> {
  try {
    const res = await fetch(`${BASE}/contacts/${contactId}`, { headers: headers() });
    if (!res.ok) return { tags: [], name: null, phone: null, email: null };
    const j: any = await res.json();
    const c = j.contact ?? j;
    return {
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
      name: c.firstName ?? c.name ?? null,
      phone: c.phone ?? null,
      email: c.email ?? null,
    };
  } catch {
    return { tags: [], name: null, phone: null, email: null };
  }
}
```

- [ ] **Step 4: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/ghl.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agent/ghl.ts src/lib/agent/__tests__/ghl.test.ts
git commit -m "feat(agent): GHL getContact client"
```

---

### Task 6: Buffer — insertar y reclamar

**Files:**
- Create: `src/lib/agent/buffer.ts`
- Create: `src/lib/agent/__tests__/buffer.test.ts`

**Interfaces:**
- Consumes: `NormalizedMessage`, `getServiceClient`.
- Produces:
  - `async function insertBufferMessage(client, msg: NormalizedMessage): Promise<void>` (INSERT en `message_buffer` con `processed=false`).
  - `async function claimBuffer(client, contactId: string): Promise<Array<{ message: string; message_type: string; media_url: string|null; created_at: string }>>` (UPDATE atómico `processed=true ... RETURNING`).

- [ ] **Step 1: Escribir el test que falla (mock encadenable)**

```typescript
// src/lib/agent/__tests__/buffer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { insertBufferMessage, claimBuffer } from '@/lib/agent/buffer';

describe('buffer', () => {
  it('insertBufferMessage manda processed=false', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ insert }) } as any;
    await insertBufferMessage(client, { contactId: 'C1', text: 'Hola', type: 'text', mediaUrl: null, name: 'Ana', phone: '7000', email: null, channel: 'Whatsapp' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ contact_id: 'C1', message: 'Hola', processed: false }));
  });

  it('claimBuffer devuelve filas reclamadas', async () => {
    const rows = [{ message: 'Hola', message_type: '1', media_url: null, created_at: 't' }];
    const select = vi.fn(async () => ({ data: rows, error: null }));
    const eq2 = vi.fn(() => ({ select }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const client = { from: () => ({ update }) } as any;
    const out = await claimBuffer(client, 'C1');
    expect(update).toHaveBeenCalledWith({ processed: true });
    expect(out).toEqual(rows);
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/buffer.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/buffer.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedMessage } from './types';

export async function insertBufferMessage(client: SupabaseClient, msg: NormalizedMessage): Promise<void> {
  const { error } = await client.from('message_buffer').insert({
    contact_id: msg.contactId,
    message: msg.text,
    media_url: msg.mediaUrl,
    message_type: msg.type === 'audio' ? 'audio' : msg.type === 'image' ? 'image' : 'text',
    name: msg.name,
    phone: msg.phone,
    email: msg.email,
    channel: msg.channel,
    processed: false,
  });
  if (error) throw new Error(`insertBufferMessage: ${error.message}`);
}

export async function claimBuffer(client: SupabaseClient, contactId: string) {
  const { data, error } = await client
    .from('message_buffer')
    .update({ processed: true })
    .eq('contact_id', contactId)
    .eq('processed', false)
    .select('message, message_type, media_url, created_at');
  if (error) throw new Error(`claimBuffer: ${error.message}`);
  return data ?? [];
}
```

> Nota de correctitud: el `UPDATE ... WHERE processed=false ... RETURNING` es atómico en Postgres; dos corridas simultáneas no reclaman las mismas filas.

- [ ] **Step 4: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/buffer.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/agent/buffer.ts src/lib/agent/__tests__/buffer.test.ts
git commit -m "feat(agent): message_buffer insert + atomic claim"
```

---

### Task 7: Migración DB — tablas, extensiones, cron, seed

**Files:**
- Create: `supabase/migrations/20260701_agent_native_foundations.sql`
- Create: `scripts/extract-system-prompt.mjs` (extrae el prompt del JSON de n8n para el seed)

**Interfaces:**
- Produces en la DB: `bot_config` (fila id=1 con el prompt del n8n), `agent_messages`, `agent_logs`, extensiones `pg_cron`/`pg_net`, job `wa-debounce`.

- [ ] **Step 1: Extraer el system prompt del n8n a un archivo**

```javascript
// scripts/extract-system-prompt.mjs
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('Hidasol - Agent Unificado v2.json', 'utf8'));
const node = d.nodes.find((n) => n.name === 'AI Agent Unificado');
let sp = node.parameters.options.systemMessage || '';
if (sp.startsWith('=')) sp = sp.slice(1); // n8n expression prefix
fs.writeFileSync('scripts/system-prompt.txt', sp);
console.log('Extraídos', sp.length, 'chars a scripts/system-prompt.txt');
```

Run: `node scripts/extract-system-prompt.mjs`
Expected: "Extraídos 5554 chars ...".

- [ ] **Step 2: Escribir la migración**

```sql
-- supabase/migrations/20260701_agent_native_foundations.sql
CREATE TABLE IF NOT EXISTS bot_config (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bot_enabled   boolean NOT NULL DEFAULT true,
  system_prompt text NOT NULL DEFAULT '',
  model         text NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  temperature   real NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    text
);

CREATE TABLE IF NOT EXISTS agent_messages (
  id         bigserial PRIMARY KEY,
  contact_id text NOT NULL,
  role       text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_messages_contact ON agent_messages(contact_id, id);

CREATE TABLE IF NOT EXISTS agent_logs (
  id          bigserial PRIMARY KEY,
  contact_id  text,
  input       text,
  output      text,
  action      text,
  tools_used  jsonb,
  tokens_in   int,
  tokens_out  int,
  latency_ms  int,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bot_config   DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs   DISABLE ROW LEVEL SECURITY;

-- Índice para el debounce
CREATE INDEX IF NOT EXISTS idx_buffer_unprocessed ON message_buffer(contact_id, created_at) WHERE processed = false;

-- Fila única de config (el system_prompt se llena en el Step 4)
INSERT INTO bot_config (id, bot_enabled, system_prompt)
VALUES (1, false, '')  -- arranca APAGADO hasta el cutover
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Aplicar la migración a Supabase**

Run (usando el pooler con las credenciales de `.env.local`):
```bash
node -e "import('pg').then(async({default:pg})=>{const c=new pg.Client({host:'aws-1-us-east-2.pooler.supabase.com',port:6543,user:'postgres.'+process.env.SUPABASE_PROJECT_REF,password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false}});await c.connect();await c.query(require('fs').readFileSync('supabase/migrations/20260701_agent_native_foundations.sql','utf8'));console.log('migración aplicada');await c.end();})"
```
(Correr con las vars de `.env.local` cargadas.) Expected: "migración aplicada".

- [ ] **Step 4: Cargar el system prompt en `bot_config`**

Run:
```bash
node -e "const fs=require('fs');import('pg').then(async({default:pg})=>{const c=new pg.Client({host:'aws-1-us-east-2.pooler.supabase.com',port:6543,user:'postgres.'+process.env.SUPABASE_PROJECT_REF,password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false}});await c.connect();const sp=fs.readFileSync('scripts/system-prompt.txt','utf8');await c.query('UPDATE bot_config SET system_prompt=\$1 WHERE id=1',[sp]);console.log('prompt cargado');await c.end();})"
```
Expected: "prompt cargado".

- [ ] **Step 5: Habilitar extensiones + programar el cron**

Ejecutar en el SQL editor de Supabase (requieren rol elevado; se documenta como paso manual):
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule('wa-debounce', '* * * * *', $$
  SELECT net.http_post(
    url := current_setting('app.process_url', true),
    headers := jsonb_build_object('content-type','application/json','x-process-secret', current_setting('app.process_secret', true)),
    body := jsonb_build_object('contact_id', b.contact_id)
  )
  FROM (
    SELECT contact_id FROM message_buffer
    WHERE processed = false
    GROUP BY contact_id
    HAVING max(created_at) <= now() - interval '30 seconds'
  ) b;
$$);
```
Y setear los settings (una vez): `ALTER DATABASE postgres SET app.process_url = 'https://<APP_URL>/api/wa/process';` y `... SET app.process_secret = '<PROCESS_SECRET>';`

- [ ] **Step 6: Verificar el cron y las tablas**

Run (pooler): `SELECT jobname, schedule FROM cron.job;` → debe listar `wa-debounce`. Y `SELECT id, bot_enabled, length(system_prompt) FROM bot_config;` → `bot_enabled=false`, largo ~5554.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260701_agent_native_foundations.sql scripts/extract-system-prompt.mjs
git commit -m "feat(db): agent foundations — bot_config, agent_messages, agent_logs, debounce cron"
```
> `scripts/system-prompt.txt` NO se commitea (deriva del JSON ignorado). Agregarlo a `.gitignore`.

---

### Task 8: Route `/api/wa/webhook`

**Files:**
- Create: `src/app/api/wa/webhook/route.ts`
- Create: `src/lib/agent/__tests__/webhook-logic.test.ts`

**Interfaces:**
- Consumes: `normalizeGhlPayload`, `getContact`, `getBotConfig`, `isBotEnabledFor`, `insertBufferMessage`, `getServiceClient`.
- Produces: `async function handleWebhook(body, deps): Promise<{ status: number; body: any }>` (lógica pura testeable) + el `POST` de Next que la envuelve.

- [ ] **Step 1: Escribir el test de la lógica (inyección de deps)**

```typescript
// src/lib/agent/__tests__/webhook-logic.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleWebhook } from '@/app/api/wa/webhook/route';

const baseDeps = () => ({
  getContact: vi.fn(async () => ({ tags: [], name: 'Ana', phone: '7000', email: null })),
  getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'X', model: 'm', temperature: 0 })),
  insertBufferMessage: vi.fn(async () => {}),
  client: {} as any,
});

describe('handleWebhook', () => {
  it('bufferea cuando el bot está habilitado', async () => {
    const deps = baseDeps();
    const res = await handleWebhook({ customData: { contact_id: 'C1', message: 'Hola' } }, deps);
    expect(res.status).toBe(200);
    expect(deps.insertBufferMessage).toHaveBeenCalled();
  });
  it('NO bufferea si el contacto tiene bot_desactivado', async () => {
    const deps = baseDeps();
    deps.getContact = vi.fn(async () => ({ tags: ['bot_desactivado'], name: null, phone: null, email: null }));
    const res = await handleWebhook({ customData: { contact_id: 'C1', message: 'Hola' } }, deps);
    expect(res.status).toBe(200);
    expect(deps.insertBufferMessage).not.toHaveBeenCalled();
  });
  it('responde 400 si el payload es inválido', async () => {
    const deps = baseDeps();
    const res = await handleWebhook({ customData: {} }, deps);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/webhook-logic.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar la route**

```typescript
// src/app/api/wa/webhook/route.ts
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
```

- [ ] **Step 4: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/webhook-logic.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/wa/webhook/route.ts src/lib/agent/__tests__/webhook-logic.test.ts
git commit -m "feat(agent): /api/wa/webhook ingest + gate + buffer"
```

---

### Task 9: Route `/api/wa/process` (esqueleto)

**Files:**
- Create: `src/app/api/wa/process/route.ts`
- Create: `src/lib/agent/__tests__/process-logic.test.ts`

**Interfaces:**
- Consumes: `claimBuffer`, `getServiceClient`.
- Produces: `async function handleProcess(contactId, deps): Promise<{ status: number; body: any }>`. En este plan **solo reclama el buffer y loguea** (sin agente); si no hay filas, no-op.

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/lib/agent/__tests__/process-logic.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleProcess } from '@/app/api/wa/process/route';

describe('handleProcess', () => {
  it('reclama el buffer y reporta cuántos mensajes tomó', async () => {
    const claimBuffer = vi.fn(async () => [{ message: 'Hola', message_type: 'text', media_url: null, created_at: 't' }]);
    const res = await handleProcess('C1', { claimBuffer, client: {} as any });
    expect(claimBuffer).toHaveBeenCalledWith(expect.anything(), 'C1');
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 1 });
  });
  it('no-op si no hay mensajes', async () => {
    const claimBuffer = vi.fn(async () => []);
    const res = await handleProcess('C1', { claimBuffer, client: {} as any });
    expect(res.body).toEqual({ contact_id: 'C1', claimed: 0 });
  });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `npx vitest run src/lib/agent/__tests__/process-logic.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 3: Implementar la route esqueleto**

```typescript
// src/app/api/wa/process/route.ts
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
```

- [ ] **Step 4: Correr y verificar PASS**

Run: `npx vitest run src/lib/agent/__tests__/process-logic.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Correr toda la suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: todos los tests passed, sin errores de tipos.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/wa/process/route.ts src/lib/agent/__tests__/process-logic.test.ts
git commit -m "feat(agent): /api/wa/process skeleton — claim buffer"
```

---

### Task 10: Verificación end-to-end del Plan 1 (sin LLM)

**Files:**
- Create: `scripts/e2e-plan1.mjs` (script de humo manual)

**Interfaces:** ninguna nueva (valida la integración).

- [ ] **Step 1: Escribir el script de humo**

```javascript
// scripts/e2e-plan1.mjs — requiere WA_WEBHOOK_SECRET, PROCESS_SECRET, APP_URL en env
const APP = process.env.APP_URL;
const cid = 'E2E_' + Math.floor(Math.random() * 1e6);
// 1) simular 2 mensajes entrantes
for (const m of ['Hola', 'quiero una lona']) {
  const r = await fetch(`${APP}/api/wa/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-wa-secret': process.env.WA_WEBHOOK_SECRET }, body: JSON.stringify({ customData: { contact_id: cid, message: m, channel: 'Whatsapp' } }) });
  console.log('webhook', m, r.status, await r.text());
}
// 2) forzar el proceso (simulando el cron)
const p = await fetch(`${APP}/api/wa/process`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-process-secret': process.env.PROCESS_SECRET }, body: JSON.stringify({ contact_id: cid }) });
console.log('process', p.status, await p.text()); // espera { claimed: 2 }
```

- [ ] **Step 2: Correr contra el deploy de preview**

Run: `node scripts/e2e-plan1.mjs`
Expected: dos `webhook ... 200 {"buffered":true}` y `process 200 {"contact_id":"E2E_...","claimed":2}`.

- [ ] **Step 3: Limpiar la fila de prueba**

Run (pooler): `DELETE FROM message_buffer WHERE contact_id LIKE 'E2E_%';`

- [ ] **Step 4: Commit**

```bash
git add scripts/e2e-plan1.mjs
git commit -m "test(agent): plan 1 end-to-end smoke script"
```

---

## Self-Review (cobertura vs spec)

- **§4 pipeline (webhook, cron, process):** Tasks 8, 7 (cron), 9. ✓
- **§5 gate on/off (global + tag GHL):** Task 2 + integración en Task 8. (estado_bot por contacto se cablea en Plan 3 con el handoff.) ✓ parcial, documentado.
- **§7 multimodal (detección de tipo):** Task 3 detecta audio/imagen; la transcripción/visión es Plan 3. ✓ parcial.
- **§8 modelo de datos (bot_config, agent_messages, agent_logs, cron):** Task 7. ✓
- **§11 seguridad (secrets server, pooler, webhook secret):** Global Constraints + Tasks 4/8/9. ✓
- **§13 recovery (claim idempotente):** Task 6 + nota. Recovery sweep de buffers viejos: el HAVING del cron ya los agarra. ✓

**Placeholder scan:** el único `TODO` es el marcador explícito de "Plan 2" en `/process` (intencional, es el punto de extensión). Sin otros placeholders.

**Ítems que requieren secretos del usuario antes de ejecutar:** `WA_WEBHOOK_SECRET` y `PROCESS_SECRET` (los generamos), `APP_URL` (del deploy), y la habilitación de `pg_cron`/`pg_net` en el dashboard de Supabase (Task 7 Step 5).
