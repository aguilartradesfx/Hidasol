# Agente WhatsApp Nativo — Plan 3: Acciones + Multimodal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `/api/wa/process` actúe hacia afuera: enviar la respuesta por WhatsApp (GHL), crear la orden en `orders` cuando el agente emite `ORDEN_COMPLETA`, hacer handoff (con apagado del bot) y producto-especial; y que entienda audio (Whisper) e imágenes (visión de Claude). Al terminar, el agente responde de verdad en WhatsApp.

**Architecture:** Un cliente GHL (enviar mensaje + tags). Un preprocesador multimodal que convierte cada mensaje del buffer a texto (audio→Whisper, imagen→descripción de Claude). Creación de orden vía una función SQL atómica (`crear_orden_bot`) llamada por RPC. Un dispatcher de acciones que, según el `tipo` parseado, ejecuta el efecto correcto. Todo cableado en `/process`, detrás del gate (el bot sigue `bot_enabled=false` hasta el cutover).

**Tech Stack:** `@anthropic-ai/sdk` (visión), `openai` (Whisper), `@supabase/supabase-js` (rpc), GHL REST, Vitest.

## Global Constraints

- GHL base `https://services.leadconnectorhq.com`, header `Version: 2021-07-28`, `Authorization: Bearer <GHL_TOKEN>` (env).
- Enviar: `POST /conversations/messages` body `{ type: 'WhatsApp', contactId, message }`.
- Tags: `POST /contacts/{id}/tags` body `{ tags: [<tag>] }`. Tags exactos: `human handoff`, `producto especial`, `bot_desactivado`.
- Handoff CIERRA el hueco (decisión del usuario): además de `human handoff`, apaga el bot para el contacto → tag `bot_desactivado` + `sessions.estado_bot='off'`.
- Whisper: OpenAI `whisper-1`, `language: 'es'`. Visión: Claude `claude-sonnet-4-5-20250929` (una llamada que devuelve texto; NO se usa visión de OpenAI).
- Creación de orden: función SQL `crear_orden_bot` que genera `ORD-YYMMDD-NNN` atómicamente e inserta; mapea los campos de `ORDEN_COMPLETA`. La orden nace en `estado='Nueva'`, `canal_contacto='WhatsApp'`, `estacion_actual='Recepción'` (coherente con el modelo de estaciones). `diseno_listo` = true si el campo es 'sí'.
- Secrets solo de env. Supabase por service key/RPC. TDD, commits por tarea, rama `feat/agente-nativo`.
- Incluye follow-ups del review del Plan 2: tipar el loop, fallback `[HANDOFF]` si `MAX_TURNS` se agota, subir `max_tokens`, `is_error:true` en tool fallida.

---

## File Structure

- Create `src/lib/agent/ghl-actions.ts` — `sendMessage`, `addTag`.
- Create `src/lib/agent/multimodal.ts` — `transcribeAudio`, `describeImage`, `rowsToText`.
- Create `src/lib/agent/tools/../order-create.ts` → `src/lib/agent/order-create.ts` — `crearOrden` (rpc).
- Create `supabase/migrations/20260701_crear_orden_bot.sql` — función SQL atómica.
- Create `src/lib/agent/actions.ts` — `executeAction(parsed, ctx)` dispatcher.
- Modify `src/lib/agent/run-agent.ts` — tipos + `MAX_TURNS` fallback + `max_tokens` + `is_error`.
- Modify `src/app/api/wa/process/route.ts` — multimodal preprocessing + executeAction.

---

### Task 1: Cliente GHL de acciones (enviar + tag)

**Files:** Create `src/lib/agent/ghl-actions.ts`, Test `src/lib/agent/__tests__/ghl-actions.test.ts`

**Interfaces:**
- `sendMessage(contactId: string, message: string): Promise<void>` → `POST /conversations/messages`.
- `addTag(contactId: string, tag: string): Promise<void>` → `POST /contacts/{id}/tags`.
Both read `GHL_TOKEN` from env, throw on non-ok response (so the caller can log), use `fetch`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/ghl-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, addTag } from '@/lib/agent/ghl-actions';

beforeEach(() => { process.env.GHL_TOKEN = 'tok'; });

describe('ghl actions', () => {
  it('sendMessage postea a /conversations/messages con el body correcto', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 201 }));
    globalThis.fetch = fetchMock as any;
    await sendMessage('C1', 'Hola');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://services.leadconnectorhq.com/conversations/messages');
    expect(JSON.parse(opts.body)).toEqual({ type: 'WhatsApp', contactId: 'C1', message: 'Hola' });
    expect(opts.headers.Authorization).toBe('Bearer tok');
  });
  it('addTag postea a /contacts/{id}/tags', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as any;
    await addTag('C1', 'bot_desactivado');
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://services.leadconnectorhq.com/contacts/C1/tags');
    expect(JSON.parse(opts.body)).toEqual({ tags: ['bot_desactivado'] });
  });
  it('sendMessage lanza si GHL responde error', async () => {
    globalThis.fetch = vi.fn(async () => new Response('err', { status: 500 })) as any;
    await expect(sendMessage('C1', 'x')).rejects.toThrow(/GHL/);
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/ghl-actions.ts
const BASE = 'https://services.leadconnectorhq.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.GHL_TOKEN}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };
}

export async function sendMessage(contactId: string, message: string): Promise<void> {
  const res = await fetch(`${BASE}/conversations/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ type: 'WhatsApp', contactId, message }),
  });
  if (!res.ok) throw new Error(`GHL sendMessage ${res.status}: ${await res.text()}`);
}

export async function addTag(contactId: string, tag: string): Promise<void> {
  const res = await fetch(`${BASE}/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ tags: [tag] }),
  });
  if (!res.ok) throw new Error(`GHL addTag ${res.status}: ${await res.text()}`);
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): GHL send message + tag actions`

---

### Task 2: Multimodal — transcripción de audio

**Files:** Create `src/lib/agent/multimodal.ts`, Test `src/lib/agent/__tests__/multimodal-audio.test.ts`

**Interfaces:**
- `transcribeAudio(mediaUrl: string, deps?: { fetch?; openai? }): Promise<string>` — descarga el audio (fetch → blob/File), llama a OpenAI `audio.transcriptions.create({ model: 'whisper-1', file, language: 'es' })`, devuelve `.text`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/multimodal-audio.test.ts
import { describe, it, expect, vi } from 'vitest';
import { transcribeAudio } from '@/lib/agent/multimodal';

describe('transcribeAudio', () => {
  it('descarga el audio y lo transcribe con whisper-1 en es', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob([new Uint8Array([1, 2, 3])]), { status: 200 }));
    const create = vi.fn(async () => ({ text: 'hola quiero una lona' }));
    const openai = { audio: { transcriptions: { create } } } as any;
    const out = await transcribeAudio('https://x/y.ogg', { fetch: fetchMock as any, openai });
    expect(fetchMock).toHaveBeenCalledWith('https://x/y.ogg');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ model: 'whisper-1', language: 'es' }));
    expect(out).toBe('hola quiero una lona');
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar (parte audio)**

```typescript
// src/lib/agent/multimodal.ts
import OpenAI, { toFile } from 'openai';

let cachedOpenai: OpenAI | null = null;
function openaiClient(): OpenAI {
  if (!cachedOpenai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
    cachedOpenai = new OpenAI({ apiKey });
  }
  return cachedOpenai;
}

export async function transcribeAudio(
  mediaUrl: string,
  deps: { fetch?: typeof fetch; openai?: OpenAI } = {},
): Promise<string> {
  const doFetch = deps.fetch ?? fetch;
  const openai = deps.openai ?? openaiClient();
  const res = await doFetch(mediaUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  const file = await toFile(buf, 'audio.ogg');
  const tr = await openai.audio.transcriptions.create({ model: 'whisper-1', file, language: 'es' });
  return tr.text;
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): audio transcription (Whisper)`

---

### Task 3: Multimodal — descripción de imagen (visión Claude)

**Files:** Modify `src/lib/agent/multimodal.ts`, Test `src/lib/agent/__tests__/multimodal-image.test.ts`

**Interfaces:**
- `describeImage(mediaUrl: string, deps?: { fetch?; anthropic? }): Promise<string>` — descarga la imagen, la manda a Claude como bloque `image` (base64), con instrucción de describir brevemente enfocándose en productos de imprenta; devuelve el texto de la descripción.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/multimodal-image.test.ts
import { describe, it, expect, vi } from 'vitest';
import { describeImage } from '@/lib/agent/multimodal';

describe('describeImage', () => {
  it('descarga la imagen y pide a Claude una descripción', async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob([new Uint8Array([1, 2, 3])]), { status: 200, headers: { 'content-type': 'image/jpeg' } }));
    const create = vi.fn(async () => ({ content: [{ type: 'text', text: 'Una lona con logo' }] }));
    const anthropic = { messages: { create } } as any;
    const out = await describeImage('https://x/y.jpg', { fetch: fetchMock as any, anthropic });
    expect(fetchMock).toHaveBeenCalledWith('https://x/y.jpg');
    expect(create).toHaveBeenCalled();
    const arg = create.mock.calls[0][0];
    expect(arg.messages[0].content.some((b: any) => b.type === 'image')).toBe(true);
    expect(out).toBe('Una lona con logo');
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar (añadir a multimodal.ts)**

```typescript
// añadir a src/lib/agent/multimodal.ts
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic } from './llm';

const IMG_PROMPT =
  'Describe brevemente qué se ve en la imagen, enfocándote en si se relaciona con productos de imprenta/rotulación (lonas, banners, tarjetas, rótulos, stickers, etc.). Máximo 2 frases.';

export async function describeImage(
  mediaUrl: string,
  deps: { fetch?: typeof fetch; anthropic?: Anthropic } = {},
): Promise<string> {
  const doFetch = deps.fetch ?? fetch;
  const anthropic = deps.anthropic ?? getAnthropic();
  const res = await doFetch(mediaUrl);
  const media_type = res.headers.get('content-type') || 'image/jpeg';
  const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type, data: b64 } },
        { type: 'text', text: IMG_PROMPT },
      ],
    }],
  });
  return msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ').trim();
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): image understanding (Claude vision)`

---

### Task 4: Preprocesar filas del buffer a texto

**Files:** Modify `src/lib/agent/multimodal.ts`, Test `src/lib/agent/__tests__/rows-to-text.test.ts`

**Interfaces:**
- `rowsToText(rows: Array<{ message: string|null; message_type: string|null; media_url: string|null }>, deps?): Promise<string>` — por cada fila: `audio`→`transcribeAudio(media_url)`; `image`→`[Imagen: ${describeImage(media_url)}] ${message ?? ''}`; else `message`. Junta con `\n`. Deps inyecta `transcribeAudio`/`describeImage`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/rows-to-text.test.ts
import { describe, it, expect, vi } from 'vitest';
import { rowsToText } from '@/lib/agent/multimodal';

describe('rowsToText', () => {
  it('convierte texto, audio e imagen a un solo string', async () => {
    const deps = {
      transcribeAudio: vi.fn(async () => 'transcripción'),
      describeImage: vi.fn(async () => 'una lona'),
    };
    const rows = [
      { message: 'hola', message_type: 'text', media_url: null },
      { message: '', message_type: 'audio', media_url: 'https://x/a.ogg' },
      { message: 'mirá', message_type: 'image', media_url: 'https://x/i.jpg' },
    ];
    const out = await rowsToText(rows, deps as any);
    expect(deps.transcribeAudio).toHaveBeenCalledWith('https://x/a.ogg', undefined);
    expect(out).toBe('hola\ntranscripción\n[Imagen: una lona] mirá');
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// añadir a src/lib/agent/multimodal.ts
export async function rowsToText(
  rows: Array<{ message: string | null; message_type: string | null; media_url: string | null }>,
  deps: { transcribeAudio?: typeof transcribeAudio; describeImage?: typeof describeImage } = {},
): Promise<string> {
  const tr = deps.transcribeAudio ?? transcribeAudio;
  const di = deps.describeImage ?? describeImage;
  const parts: string[] = [];
  for (const r of rows) {
    if (r.message_type === 'audio' && r.media_url) parts.push(await tr(r.media_url, undefined));
    else if (r.message_type === 'image' && r.media_url) parts.push(`[Imagen: ${await di(r.media_url, undefined)}] ${r.message ?? ''}`.trim());
    else if (r.message) parts.push(r.message);
  }
  return parts.join('\n');
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): buffer rows → text (multimodal)`

---

### Task 5: Migración — función SQL `crear_orden_bot`

**Files:** Create `supabase/migrations/20260701_crear_orden_bot.sql`

**Interfaces:** en la DB: `crear_orden_bot(p jsonb) returns text` — genera `ORD-YYMMDD-NNN` atómico, inserta en `orders`, devuelve `order_id`.

- [ ] **Step 1: Escribir la migración**

```sql
-- supabase/migrations/20260701_crear_orden_bot.sql
CREATE OR REPLACE FUNCTION crear_orden_bot(p jsonb) RETURNS text AS $$
DECLARE
  new_id text;
BEGIN
  SELECT 'ORD-' || to_char(now(), 'YYMMDD') || '-' ||
         LPAD((SELECT COUNT(*) + 1 FROM orders WHERE order_id LIKE 'ORD-' || to_char(now(), 'YYMMDD') || '%')::text, 3, '0')
  INTO new_id;

  INSERT INTO orders (
    order_id, contact_id, cliente, contacto_whatsapp, email_cliente,
    producto_id, producto_nombre, tipo_trabajo, material, tamano,
    color_impresion, tecnica, caras, acabados, cantidad,
    diseno_listo, tipo_diseno, factura_electronica, empresa_factura,
    cedula_juridica, notas, estado, canal_contacto,
    estacion_actual, estacion_desde, fecha_ingreso
  ) VALUES (
    new_id,
    p->>'contact_id',
    p->'orden'->>'cliente',
    p->'orden'->>'telefono',
    p->'orden'->>'email',
    p->'orden'->>'producto_id',
    p->'orden'->>'producto_nombre',
    p->'orden'->>'producto_nombre',
    p->'orden'->'variables_seleccionadas'->>'material',
    p->'orden'->'variables_seleccionadas'->>'tamano',
    p->'orden'->'variables_seleccionadas'->>'color_impresion',
    p->'orden'->'variables_seleccionadas'->>'tecnica',
    p->'orden'->'variables_seleccionadas'->>'caras',
    p->'orden'->'variables_seleccionadas'->>'acabado',
    p->'orden'->>'cantidad',
    (lower(coalesce(p->'orden'->>'diseno_listo','')) = 'sí'),
    p->'orden'->>'tipo_diseno',
    p->'orden'->>'factura_electronica',
    p->'orden'->>'empresa_factura',
    p->'orden'->>'cedula_juridica',
    p->'orden'->>'notas',
    'Nueva', 'WhatsApp',
    'Recepción', now(), now()::text
  );
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 2: Aplicar a la DB** (pooler, con env de `.env.local`)

```bash
node -e "const fs=require('fs');import('pg').then(async({default:pg})=>{const c=new pg.Client({host:'aws-1-us-east-2.pooler.supabase.com',port:6543,user:'postgres.'+process.env.SUPABASE_PROJECT_REF,password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false}});await c.connect();await c.query(fs.readFileSync('supabase/migrations/20260701_crear_orden_bot.sql','utf8'));console.log('función creada');await c.end();})"
```
Expected: "función creada".

- [ ] **Step 3: Verificar con una orden de prueba y borrarla**

```bash
node -e "import('pg').then(async({default:pg})=>{const c=new pg.Client({host:'aws-1-us-east-2.pooler.supabase.com',port:6543,user:'postgres.'+process.env.SUPABASE_PROJECT_REF,password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query(\"SELECT crear_orden_bot('{\\\"contact_id\\\":\\\"__t__\\\",\\\"orden\\\":{\\\"cliente\\\":\\\"Test\\\",\\\"producto_nombre\\\":\\\"Lona\\\",\\\"cantidad\\\":\\\"2\\\",\\\"variables_seleccionadas\\\":{}}}'::jsonb) AS id\");console.log('order_id:',r.rows[0].id);await c.query(\"DELETE FROM orders WHERE contact_id='__t__'\");console.log('limpiado');await c.end();})"
```
Expected: un `order_id` tipo `ORD-...-001` y "limpiado".

- [ ] **Step 4: Commit** `feat(db): crear_orden_bot atomic order-creation function`

---

### Task 6: Módulo de creación de orden (RPC)

**Files:** Create `src/lib/agent/order-create.ts`, Test `src/lib/agent/__tests__/order-create.test.ts`

**Interfaces:**
- `crearOrden(client, contactId: string, orden: any): Promise<string>` → `client.rpc('crear_orden_bot', { p: { contact_id: contactId, orden } })`, devuelve el `order_id` (string), lanza en error.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/order-create.test.ts
import { describe, it, expect, vi } from 'vitest';
import { crearOrden } from '@/lib/agent/order-create';

describe('crearOrden', () => {
  it('llama a crear_orden_bot con el payload y devuelve el order_id', async () => {
    const rpc = vi.fn(async () => ({ data: 'ORD-260701-001', error: null }));
    const id = await crearOrden({ rpc } as any, 'C1', { cliente: 'Ana', producto_nombre: 'Lona' });
    expect(rpc).toHaveBeenCalledWith('crear_orden_bot', { p: { contact_id: 'C1', orden: { cliente: 'Ana', producto_nombre: 'Lona' } } });
    expect(id).toBe('ORD-260701-001');
  });
  it('lanza si hay error', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
    await expect(crearOrden({ rpc } as any, 'C1', {})).rejects.toThrow(/crear_orden_bot/);
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/order-create.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function crearOrden(client: SupabaseClient, contactId: string, orden: any): Promise<string> {
  const { data, error } = await client.rpc('crear_orden_bot', { p: { contact_id: contactId, orden } });
  if (error) throw new Error(`crear_orden_bot: ${error.message}`);
  return data as string;
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): order creation via crear_orden_bot RPC`

---

### Task 7: Dispatcher de acciones

**Files:** Create `src/lib/agent/actions.ts`, Test `src/lib/agent/__tests__/actions.test.ts`

**Interfaces:**
- `executeAction(parsed, ctx): Promise<{ action: string; orderId?: string }>` donde `parsed` es el `ParsedOutput` y `ctx` inyecta `{ client, contactId, sendMessage, addTag, crearOrden, setBotOff }`.
  - `mensaje`: `sendMessage(contactId, agent_response)`.
  - `producto_especial`: `sendMessage(agent_response)` + `addTag('producto especial')`.
  - `handoff`: `sendMessage(agent_response)` + `addTag('human handoff')` + **apagar**: `addTag('bot_desactivado')` + `setBotOff(client, contactId)`.
  - `orden_completa`: `crearOrden(client, contactId, orden)` → `sendMessage('Listo! ... Tu número de orden es ${id}. Guardalo para consultar el estado.')`.
- `setBotOff(client, contactId)` → `client.from('sessions').update({ estado_bot: 'off' }).eq('contact_id', contactId)`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { executeAction } from '@/lib/agent/actions';

function ctx(over: any = {}) {
  return {
    client: {} as any, contactId: 'C1',
    sendMessage: vi.fn(async () => {}),
    addTag: vi.fn(async () => {}),
    crearOrden: vi.fn(async () => 'ORD-260701-001'),
    setBotOff: vi.fn(async () => {}),
    ...over,
  };
}

describe('executeAction', () => {
  it('mensaje → envía', async () => {
    const c = ctx();
    await executeAction({ tipo: 'mensaje', contact_id: 'C1', agent_response: 'Hola' }, c);
    expect(c.sendMessage).toHaveBeenCalledWith('C1', 'Hola');
  });
  it('handoff → envía + tags human handoff y bot_desactivado + apaga sesión', async () => {
    const c = ctx();
    await executeAction({ tipo: 'handoff', contact_id: 'C1', agent_response: 'Te paso' }, c);
    expect(c.sendMessage).toHaveBeenCalledWith('C1', 'Te paso');
    expect(c.addTag).toHaveBeenCalledWith('C1', 'human handoff');
    expect(c.addTag).toHaveBeenCalledWith('C1', 'bot_desactivado');
    expect(c.setBotOff).toHaveBeenCalledWith(c.client, 'C1');
  });
  it('orden_completa → crea orden y confirma con el número', async () => {
    const c = ctx();
    const r = await executeAction({ tipo: 'orden_completa', contact_id: 'C1', orden: { cliente: 'Ana' } }, c);
    expect(c.crearOrden).toHaveBeenCalledWith(c.client, 'C1', { cliente: 'Ana' });
    expect(c.sendMessage).toHaveBeenCalledWith('C1', expect.stringContaining('ORD-260701-001'));
    expect(r.orderId).toBe('ORD-260701-001');
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/agent/actions.ts
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
```

- [ ] **Step 4: Correr → PASS**. **Step 5: Commit** `feat(agent): action dispatcher (send/order/handoff/special)`

---

### Task 8: Endurecer el loop (follow-ups del Plan 2)

**Files:** Modify `src/lib/agent/run-agent.ts`, Test `src/lib/agent/__tests__/run-agent.test.ts`

**Interfaces:** sin cambios de firma pública. Cambios internos:
- Tipar: `import Anthropic from '@anthropic-ai/sdk'`; `const res: Anthropic.Message = await ...`; `tools: TOOL_DEFS as Anthropic.Tool[]`.
- `max_tokens: 2048` (subir de 1024).
- Tool fallida: el `tool_result` lleva `is_error: true`.
- Si el `for` de `MAX_TURNS` termina sin texto final (`output === ''`), devolver `output = '[HANDOFF]'` (fallback: nunca dejar al cliente sin acción → el dispatcher hará handoff).

- [ ] **Step 1: Añadir test del fallback y del is_error**

```typescript
// añadir a src/lib/agent/__tests__/run-agent.test.ts
it('si se agotan los turnos sin texto final, devuelve [HANDOFF]', async () => {
  const create = vi.fn(async () => ({
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 't', name: 'buscar_producto', input: { termino: 'x' } }],
    usage: { input_tokens: 1, output_tokens: 1 },
  }));
  const r = await runAgent({
    contactId: 'C1', userText: 'x', systemPrompt: 'S', model: 'm', history: [], client: {} as any,
    deps: { anthropic: { messages: { create } } as any, runTool: vi.fn(async () => ({})) },
  });
  expect(r.output).toBe('[HANDOFF]');
});
it('marca is_error cuando la tool falla', async () => {
  const create = vi.fn()
    .mockResolvedValueOnce({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't', name: 'buscar_producto', input: {} }], usage: { input_tokens: 1, output_tokens: 1 } })
    .mockResolvedValueOnce({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 1, output_tokens: 1 } });
  const runTool = vi.fn(async () => { throw new Error('boom'); });
  await runAgent({ contactId: 'C1', userText: 'x', systemPrompt: 'S', model: 'm', history: [], client: {} as any, deps: { anthropic: { messages: { create } } as any, runTool } });
  const secondCallMessages = create.mock.calls[1][0].messages;
  const toolResult = secondCallMessages[secondCallMessages.length - 1].content[0];
  expect(toolResult.is_error).toBe(true);
});
```

- [ ] **Step 2: Correr → FAIL** (los nuevos tests)

- [ ] **Step 3: Implementar los cambios en `run-agent.ts`**
  - Añadir `import Anthropic from '@anthropic-ai/sdk';`.
  - `max_tokens: 2048`.
  - En el catch de la tool: `toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result ?? null), ...(errored ? { is_error: true } : {}) });` (marcar `errored` en el catch).
  - Después del `for`, si `output === ''`, `output = '[HANDOFF]';`.
  - Tipar `res` como `Anthropic.Message` y `tools: TOOL_DEFS as Anthropic.Tool[]`.

```typescript
// fragmento del bloque tool_use en run-agent.ts
for (const block of res.content) {
  if (block.type === 'tool_use') {
    toolsUsed.push(block.name);
    let result: any;
    let errored = false;
    try {
      result = await runTool(block.name, block.input, params.client);
    } catch (e: any) {
      result = { error: e.message };
      errored = true;
    }
    toolResults.push({
      type: 'tool_result',
      tool_use_id: block.id,
      content: JSON.stringify(result ?? null),
      ...(errored ? { is_error: true } : {}),
    });
  }
}
```
```typescript
// tras el for principal:
if (output === '') output = '[HANDOFF]';
return { output, toolsUsed, tokensIn, tokensOut };
```

- [ ] **Step 4: Correr → PASS** (todos, incluidos los 2 originales). **Step 5: `npx tsc --noEmit`** limpio. **Step 6: Commit** `fix(agent): loop hardening — is_error, handoff fallback, max_tokens, typing`

---

### Task 9: Cablear acciones + multimodal en `/api/wa/process`

**Files:** Modify `src/app/api/wa/process/route.ts`, Test `src/lib/agent/__tests__/process-actions.test.ts`

**Interfaces:** `handleProcess` pasa a: claim → si vacío no-op → **`rowsToText(rows)`** (multimodal) para el `userText` → config + memoria → `runAgent` → `parseAgentOutput` → **`executeAction(parsed, {client, contactId, ...})`** → saveTurn(user)+saveTurn(assistant) → logAgent (con `action`/`orderId`) → return `{contact_id, claimed, tipo, action, orderId}`. Deps inyectables incluyen `rowsToText` y `executeAction`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/process-actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleProcess } from '@/app/api/wa/process/route';

function deps(over: any = {}) {
  return {
    client: {} as any,
    claimBuffer: vi.fn(async () => [{ message: 'hola', message_type: 'text', media_url: null, created_at: 't' }]),
    rowsToText: vi.fn(async () => 'hola'),
    getBotConfig: vi.fn(async () => ({ botEnabled: true, systemPrompt: 'S', model: 'm', temperature: 0 })),
    loadMemory: vi.fn(async () => []),
    saveTurn: vi.fn(async () => {}),
    runAgent: vi.fn(async () => ({ output: '¿Cuántas querés?', toolsUsed: [], tokensIn: 5, tokensOut: 4 })),
    executeAction: vi.fn(async () => ({ action: 'mensaje' })),
    logAgent: vi.fn(async () => {}),
    ...over,
  };
}

describe('handleProcess (con acciones)', () => {
  it('preprocesa multimodal, corre el agente y ejecuta la acción', async () => {
    const d = deps();
    const res = await handleProcess('C1', d);
    expect(d.rowsToText).toHaveBeenCalled();
    expect(d.executeAction).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'mensaje' }), expect.objectContaining({ contactId: 'C1' }));
    expect(res.body).toMatchObject({ contact_id: 'C1', claimed: 1, tipo: 'mensaje', action: 'mensaje' });
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

- [ ] **Step 3: Implementar** (actualiza `handleProcess` + el `POST` wrapper con las deps reales)

```typescript
// src/app/api/wa/process/route.ts (handleProcess + POST)
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
```

- [ ] **Step 4: Correr → PASS** (`process-actions.test.ts` + suite completa). Borrar el `process-agent.test.ts` viejo si su shape de deps ya no aplica (superado por `process-actions.test.ts`). **Step 5: `npx tsc --noEmit`** limpio. **Step 6: Commit** `feat(agent): wire actions + multimodal into /process`

---

## Self-Review (cobertura vs spec §7, §9 y follow-ups Plan 2)

- Enviar por GHL: Task 1 + 7. ✓
- Crear orden (`ORDEN_COMPLETA` → `orders`): Task 5 (SQL) + 6 (rpc) + 7 (dispatch). ✓
- Handoff con apagado (cerrar el hueco): Task 7 (human handoff + bot_desactivado + estado_bot=off). ✓
- Producto especial: Task 7. ✓
- Multimodal audio (Whisper es): Task 2. Imagen (visión Claude, sin OpenAI vision): Task 3. Preprocesado: Task 4. ✓
- Follow-ups Plan 2 (is_error, handoff fallback, max_tokens, typing): Task 8. ✓
- Integración en /process: Task 9. ✓
- **Fuera de alcance:** avisos al equipo (mensajes internos) — el n8n los tenía; se pueden añadir en Plan 5 si se quieren. El envío al cliente sí está.
- **Placeholder scan:** sin TBD. Task 5 aplica la función a la DB real (con prueba+limpieza). El resto es unit-testeado con mocks.
- Nota: el bot sigue `bot_enabled=false`; nada de esto responde a clientes reales hasta el cutover (Plan 5).
```
