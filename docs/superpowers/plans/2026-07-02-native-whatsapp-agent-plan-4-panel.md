# Agente WhatsApp Nativo — Plan 4: Panel del Superadmin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una sección nueva en el panel de admin (visible solo para rol `admin`) donde el superadmin puede: prender/apagar el bot (global y por contacto), editar el system prompt, y gestionar la base de conocimiento (con re-embedding) y los productos — todo con efecto inmediato en el agente, sin redeploy.

**Architecture:** Un módulo cliente `admin-store.ts` (lee/escribe Supabase con el cliente browser, patrón `order-store.ts`) para bot_config, productos y `sessions.estado_bot`. La gestión de conocimiento pasa por una API route (`/api/admin/knowledge`) porque requiere generar el embedding (OpenAI, server-side). Una vista `AdminPanelView` con pestañas (Bot / Prompt / Conocimiento / Productos), cableada al sidebar como entrada `adminOnly`.

**Tech Stack:** Next.js 14 App Router, React, shadcn/ui (Switch, Textarea, Tabs, Button, Input, Dialog, Table), `@supabase/supabase-js` (browser), Vitest.

## Global Constraints

- Rol más alto = `'admin'`; gating con `useAuth()` → `isAdmin` (y el bloque en `page.tsx` ya exige `isAdmin`). Defense-in-depth: la vista también chequea `isAdmin`.
- Escrituras cliente-directas con el singleton browser (anon key, RLS desactivado) — patrón existente (`order-store.ts`). El conocimiento (embedding) va por `/api/admin/knowledge` (service key + OpenAI).
- Embeddings del conocimiento: OpenAI `text-embedding-3-small` (1536), MISMO modelo que los vectores existentes. Reusar `embed()` de `@/lib/agent/embeddings`.
- El agente lee `bot_config`/`productos`/`knowledge_chunks` en cada corrida → cambios del panel tienen efecto inmediato.
- Estilo: seguir el idioma del repo (`rounded-[12px] border border-border bg-card p-4`, título `text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque']`, acento `text-[#F97316]`). Usar primitivas shadcn para controles (Switch/Textarea/Button/Input/Tabs/Dialog/Table).
- `useToast()` para feedback de guardado.
- **Seguridad (contexto):** la app no tiene auth server-side; las rutas admin y las escrituras cliente heredan la postura actual (anon key + RLS off + auth client-side, el "problema crítico" conocido). Plan 4 NO lo empeora ni lo arregla; se documenta.
- TDD para la lógica (`admin-store`, la API route). Los componentes React son presentacionales (el repo no tiene tests de componentes) → su verificación es `npx tsc --noEmit` + `npm run build` + smoke manual.
- TDD, commits por tarea, rama `feat/agente-nativo`.

---

## File Structure

- Create `supabase/migrations/20260702_rls_config_tables.sql` — asegura RLS off en `productos`, `knowledge_chunks` (idempotente).
- Create `src/lib/admin-store.ts` — CRUD cliente-directo (bot_config, productos, sessions estado_bot, knowledge list/delete).
- Create `src/app/api/admin/knowledge/route.ts` — upsert (embed+insert/update) + delete de knowledge_chunks.
- Create `src/components/orders/admin-panel-view.tsx` — la vista con pestañas.
- Create sub-componentes por pestaña bajo `src/components/orders/admin/` (`bot-tab.tsx`, `prompt-tab.tsx`, `productos-tab.tsx`, `conocimiento-tab.tsx`).
- Modify `src/app/page.tsx` — `NavSection` + bloque de render.
- Modify `src/components/layout/sidebar.tsx` — `NavSection` + item `adminOnly`.

---

### Task 1: Migración — RLS off en productos + knowledge_chunks

**Files:** Create `supabase/migrations/20260702_rls_config_tables.sql`

**Interfaces:** en la DB: `productos` y `knowledge_chunks` con RLS deshabilitado (para lectura/escritura del cliente browser).

- [ ] **Step 1: Escribir la migración**

```sql
-- supabase/migrations/20260702_rls_config_tables.sql
-- El panel del superadmin lee/escribe estas tablas con el cliente browser (anon key),
-- consistente con orders/sessions. RLS off (idempotente).
ALTER TABLE IF EXISTS public.productos        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.knowledge_chunks DISABLE ROW LEVEL SECURITY;
-- bot_config / agent_messages / agent_logs / sessions ya tienen RLS off de migraciones previas.
```

- [ ] **Step 2: Verificar estado ANTES + aplicar** (pooler, env de `.env.local`)

```bash
node -e "import('pg').then(async({default:pg})=>{const c=new pg.Client({host:'aws-1-us-east-2.pooler.supabase.com',port:6543,user:'postgres.'+process.env.SUPABASE_PROJECT_REF,password:process.env.SUPABASE_DB_PASSWORD,database:'postgres',ssl:{rejectUnauthorized:false}});await c.connect();const b=await c.query(\"SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('productos','knowledge_chunks')\");console.log('antes:',b.rows);await c.query(require('fs').readFileSync('supabase/migrations/20260702_rls_config_tables.sql','utf8'));const a=await c.query(\"SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('productos','knowledge_chunks')\");console.log('después:',a.rows);await c.end();})"
```
Expected: `relrowsecurity` = false para ambas después.

- [ ] **Step 3: Commit** `feat(db): RLS off en productos + knowledge_chunks para el panel`

---

### Task 2: `admin-store.ts` (CRUD cliente-directo)

**Files:** Create `src/lib/admin-store.ts`, Test `src/lib/__tests__/admin-store.test.ts`

**Interfaces (todas reciben un `client` opcional para test; por defecto el singleton browser):**
- `getBotConfig(client?): Promise<{ botEnabled: boolean; systemPrompt: string }>` — lee `bot_config` id=1.
- `setBotEnabled(enabled: boolean, updatedBy: string, client?): Promise<void>` — update bot_config.
- `setSystemPrompt(prompt: string, updatedBy: string, client?): Promise<void>` — update bot_config.
- `listContactStates(client?): Promise<Array<{ contact_id: string; name: string|null; estado_bot: string|null; updated_at: string|null }>>` — de `sessions`, últimas 50 por updated_at.
- `setContactBot(contactId: string, on: boolean, client?): Promise<void>` — `sessions.estado_bot` = 'idle'|'off'.
- `listProductos(client?): Promise<any[]>` — todos.
- `upsertProducto(p: any, client?): Promise<void>` — upsert en `productos`.
- `deleteProducto(id: string, client?): Promise<void>`.
- `listKnowledge(client?): Promise<any[]>` — id, contenido, categoria.
- `deleteKnowledge(id: string, client?): Promise<void>`.

- [ ] **Step 1: Escribir el test que falla** (mock encadenable del cliente)

```typescript
// src/lib/__tests__/admin-store.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getBotConfig, setBotEnabled, setContactBot, upsertProducto } from '@/lib/admin-store';

describe('admin-store', () => {
  it('getBotConfig lee la fila 1', async () => {
    const maybeSingle = vi.fn(async () => ({ data: { bot_enabled: true, system_prompt: 'X' }, error: null }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = { from: () => ({ select }) } as any;
    expect(await getBotConfig(client)).toEqual({ botEnabled: true, systemPrompt: 'X' });
  });
  it('setBotEnabled actualiza bot_config', async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: () => ({ update }) } as any;
    await setBotEnabled(false, 'Admin', client);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ bot_enabled: false, updated_by: 'Admin' }));
  });
  it('setContactBot mapea on/off a estado_bot idle/off', async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const client = { from: () => ({ update }) } as any;
    await setContactBot('C1', false, client);
    expect(update).toHaveBeenCalledWith({ estado_bot: 'off' });
  });
  it('upsertProducto hace upsert', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ upsert }) } as any;
    await upsertProducto({ id: 'p1', producto: 'Lona' }, client);
    expect(upsert).toHaveBeenCalledWith({ id: 'p1', producto: 'Lona' });
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/lib/admin-store.ts
'use client';
import { createClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

function db(client?: SupabaseClient): SupabaseClient {
  return client ?? (createClient() as SupabaseClient);
}

export async function getBotConfig(client?: SupabaseClient) {
  const { data, error } = await db(client).from('bot_config').select('bot_enabled, system_prompt').eq('id', 1).maybeSingle();
  if (error) throw new Error(`getBotConfig: ${error.message}`);
  return { botEnabled: !!data?.bot_enabled, systemPrompt: data?.system_prompt ?? '' };
}

export async function setBotEnabled(enabled: boolean, updatedBy: string, client?: SupabaseClient) {
  const { error } = await db(client).from('bot_config').update({ bot_enabled: enabled, updated_by: updatedBy, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw new Error(`setBotEnabled: ${error.message}`);
}

export async function setSystemPrompt(prompt: string, updatedBy: string, client?: SupabaseClient) {
  const { error } = await db(client).from('bot_config').update({ system_prompt: prompt, updated_by: updatedBy, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw new Error(`setSystemPrompt: ${error.message}`);
}

export async function listContactStates(client?: SupabaseClient) {
  const { data, error } = await db(client).from('sessions').select('contact_id, name, estado_bot, updated_at').order('updated_at', { ascending: false }).limit(50);
  if (error) throw new Error(`listContactStates: ${error.message}`);
  return data ?? [];
}

export async function setContactBot(contactId: string, on: boolean, client?: SupabaseClient) {
  const { error } = await db(client).from('sessions').update({ estado_bot: on ? 'idle' : 'off' }).eq('contact_id', contactId);
  if (error) throw new Error(`setContactBot: ${error.message}`);
}

export async function listProductos(client?: SupabaseClient) {
  const { data, error } = await db(client).from('productos').select('*').order('categoria', { ascending: true });
  if (error) throw new Error(`listProductos: ${error.message}`);
  return data ?? [];
}

export async function upsertProducto(p: any, client?: SupabaseClient) {
  const { error } = await db(client).from('productos').upsert(p);
  if (error) throw new Error(`upsertProducto: ${error.message}`);
}

export async function deleteProducto(id: string, client?: SupabaseClient) {
  const { error } = await db(client).from('productos').delete().eq('id', id);
  if (error) throw new Error(`deleteProducto: ${error.message}`);
}

export async function listKnowledge(client?: SupabaseClient) {
  const { data, error } = await db(client).from('knowledge_chunks').select('id, contenido, categoria').order('categoria', { ascending: true });
  if (error) throw new Error(`listKnowledge: ${error.message}`);
  return data ?? [];
}

export async function deleteKnowledge(id: string, client?: SupabaseClient) {
  const { error } = await db(client).from('knowledge_chunks').delete().eq('id', id);
  if (error) throw new Error(`deleteKnowledge: ${error.message}`);
}
```

- [ ] **Step 4: Correr → PASS** (`npx vitest run src/lib/__tests__/admin-store.test.ts`). **Step 5: `npx tsc --noEmit`** limpio. **Step 6: Commit** `feat(admin): admin-store client CRUD`

---

### Task 3: API route `/api/admin/knowledge` (embed + upsert / delete)

**Files:** Create `src/app/api/admin/knowledge/route.ts`, Test `src/lib/agent/__tests__/admin-knowledge-route.test.ts`

**Interfaces:**
- `handleUpsert(body, deps): Promise<{ status; body }>` — `{ id?, contenido, categoria }` → `embed(contenido)` → upsert en `knowledge_chunks` (`{ id?, contenido, categoria, embedding }`). Genera id si falta.
- `POST(req)` — enruta a upsert; `DELETE(req)` — borra por `id`.

- [ ] **Step 1: Test que falla**

```typescript
// src/lib/agent/__tests__/admin-knowledge-route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleUpsert } from '@/app/api/admin/knowledge/route';

describe('handleUpsert (knowledge)', () => {
  it('embebe el contenido y hace upsert con el embedding', async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const client = { from: () => ({ upsert }) } as any;
    const embed = vi.fn(async () => [0.1, 0.2]);
    const res = await handleUpsert({ contenido: 'Estamos en San Carlos', categoria: 'ubicacion' }, { client, embed });
    expect(embed).toHaveBeenCalledWith('Estamos en San Carlos');
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ contenido: 'Estamos en San Carlos', categoria: 'ubicacion', embedding: [0.1, 0.2] }));
    expect(res.status).toBe(200);
  });
  it('400 si falta contenido', async () => {
    const res = await handleUpsert({ categoria: 'x' }, { client: {} as any, embed: vi.fn() });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Correr → FAIL**

- [ ] **Step 3: Implementar**

```typescript
// src/app/api/admin/knowledge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/agent/supabase-server';
import { embed as defaultEmbed } from '@/lib/agent/embeddings';

interface Deps { client: any; embed: typeof defaultEmbed; }

export async function handleUpsert(body: any, deps: Deps): Promise<{ status: number; body: any }> {
  const contenido = (body?.contenido ?? '').trim();
  if (!contenido) return { status: 400, body: { error: 'contenido requerido' } };
  const embedding = await deps.embed(contenido);
  const row: any = { contenido, categoria: body.categoria ?? null, embedding };
  if (body.id) row.id = body.id;
  const { error } = await deps.client.from('knowledge_chunks').upsert(row);
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { ok: true } };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const res = await handleUpsert(body, { client: getServiceClient(), embed: defaultEmbed });
  return NextResponse.json(res.body, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  const { error } = await getServiceClient().from('knowledge_chunks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Correr → PASS**. **Step 5: `npx tsc --noEmit`** limpio. **Step 6: Commit** `feat(admin): knowledge upsert route (embed) + delete`

---

### Task 4: Vista con pestañas + cableado al nav

**Files:** Create `src/components/orders/admin-panel-view.tsx`, Modify `src/app/page.tsx`, `src/components/layout/sidebar.tsx`

**Interfaces:** `AdminPanelView` (client component, sin props). Nueva `NavSection` `'bot-admin'`.

- [ ] **Step 1: Crear el shell con Tabs**

```tsx
// src/components/orders/admin-panel-view.tsx
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { BotTab } from './admin/bot-tab';
import { PromptTab } from './admin/prompt-tab';
import { ConocimientoTab } from './admin/conocimiento-tab';
import { ProductosTab } from './admin/productos-tab';

export function AdminPanelView() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground">
          Agente <span className="text-[#F97316]">IA</span>
        </h1>
        <p className="text-sm text-muted-foreground">Controlá el bot de WhatsApp: encendido, comportamiento, conocimiento y productos.</p>
      </div>
      <Tabs defaultValue="bot">
        <TabsList>
          <TabsTrigger value="bot">Bot</TabsTrigger>
          <TabsTrigger value="prompt">Comportamiento</TabsTrigger>
          <TabsTrigger value="conocimiento">Conocimiento</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="bot"><BotTab /></TabsContent>
        <TabsContent value="prompt"><PromptTab /></TabsContent>
        <TabsContent value="conocimiento"><ConocimientoTab /></TabsContent>
        <TabsContent value="productos"><ProductosTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```
> Crear placeholders mínimos para los 4 tabs (`src/components/orders/admin/*.tsx`) que exporten un componente vacío `export function BotTab(){return null}` etc., para que compile. Se llenan en Tasks 5-8.

- [ ] **Step 2: Cablear el nav** — en `src/components/layout/sidebar.tsx`: agregar `'bot-admin'` al type `NavSection` y un item `{ id: 'bot-admin', label: 'Agente IA', icon: Bot, adminOnly: true }` (importar `Bot` de `lucide-react`) al array `navItems`. En `src/app/page.tsx`: agregar `'bot-admin'` al type `NavSection` y el bloque `{activeSection === 'bot-admin' && isAdmin && (<AdminPanelView />)}` junto a los demás (importar `AdminPanelView`).

- [ ] **Step 3: Verificar** — `npx tsc --noEmit` limpio y `npm run build` OK.

- [ ] **Step 4: Commit** `feat(admin): panel shell + nav wiring (Agente IA)`

---

### Task 5: Pestaña Bot (on/off global + por contacto)

**Files:** Create/replace `src/components/orders/admin/bot-tab.tsx`

**Interfaces:** usa `getBotConfig`/`setBotEnabled`/`listContactStates`/`setContactBot` de `admin-store`, `useAuth` (para `updatedBy`), `useToast`.

- [ ] **Step 1: Implementar** (Switch global + lista de contactos con Switch por fila)

```tsx
// src/components/orders/admin/bot-tab.tsx
'use client';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getBotConfig, setBotEnabled, listContactStates, setContactBot } from '@/lib/admin-store';

export function BotTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const by = user?.name ?? 'Admin';

  useEffect(() => {
    getBotConfig().then((c) => setEnabled(c.botEnabled)).catch(() => {});
    listContactStates().then(setContacts).catch(() => {});
  }, []);

  async function toggleGlobal(v: boolean) {
    setEnabled(v);
    try { await setBotEnabled(v, by); toast({ title: v ? 'Bot encendido' : 'Bot apagado' }); }
    catch (e: any) { setEnabled(!v); toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }
  async function toggleContact(cid: string, v: boolean) {
    setContacts((cs) => cs.map((c) => c.contact_id === cid ? { ...c, estado_bot: v ? 'idle' : 'off' } : c));
    try { await setContactBot(cid, v); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="rounded-[12px] border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">Bot global</p>
          <p className="text-sm text-muted-foreground">Cuando está apagado, el bot no responde a nadie.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleGlobal} />
      </div>
      <div className="rounded-[12px] border border-border bg-card p-4">
        <p className="font-semibold mb-3">Por contacto (apagar para que un humano tome el chat)</p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {contacts.map((c) => (
            <div key={c.contact_id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <span className="text-sm truncate">{c.name || c.contact_id}</span>
              <Switch checked={c.estado_bot !== 'off'} onCheckedChange={(v) => toggleContact(c.contact_id, v)} />
            </div>
          ))}
          {contacts.length === 0 && <p className="text-sm text-muted-foreground">Sin conversaciones aún.</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** `npx tsc --noEmit` + `npm run build`. **Step 3: Commit** `feat(admin): bot on/off tab (global + por contacto)`

---

### Task 6: Pestaña Comportamiento (editor de prompt)

**Files:** Create/replace `src/components/orders/admin/prompt-tab.tsx`

- [ ] **Step 1: Implementar** (Textarea + botón Guardar)

```tsx
// src/components/orders/admin/prompt-tab.tsx
'use client';
import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getBotConfig, setSystemPrompt } from '@/lib/admin-store';

export function PromptTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { getBotConfig().then((c) => setPrompt(c.systemPrompt)).catch(() => {}); }, []);

  async function save() {
    setSaving(true);
    try { await setSystemPrompt(prompt, user?.name ?? 'Admin'); toast({ title: 'Prompt guardado', description: 'Aplica en el próximo mensaje.' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm text-muted-foreground">Instrucciones del agente. Cambia su comportamiento de inmediato. Editá con cuidado.</p>
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={20} className="font-mono text-xs" />
      <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar prompt'}</Button>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** tsc + build. **Step 3: Commit** `feat(admin): system prompt editor tab`

---

### Task 7: Pestaña Productos (CRUD)

**Files:** Create/replace `src/components/orders/admin/productos-tab.tsx`

**Interfaces:** usa `listProductos`/`upsertProducto`/`deleteProducto`. Tabla con editar (Dialog) + eliminar + agregar. Campos editables mínimos: `producto`, `categoria`, `activo` (los `variables`/`cantidades` jsonb se muestran read-only o como texto JSON editable — mantener simple: `producto`, `categoria`, `activo`).

- [ ] **Step 1: Implementar** (Table + Dialog de edición/creación)

```tsx
// src/components/orders/admin/productos-tab.tsx
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { listProductos, upsertProducto, deleteProducto } from '@/lib/admin-store';

export function ProductosTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const reload = () => listProductos().then(setItems).catch(() => {});
  useEffect(() => { reload(); }, []);

  async function save() {
    try { await upsertProducto(edit); setOpen(false); reload(); toast({ title: 'Producto guardado' }); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }
  async function remove(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await deleteProducto(id); reload(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-3 pt-4">
      <Button size="sm" onClick={() => { setEdit({ producto: '', categoria: '', activo: true }); setOpen(true); }}>+ Producto</Button>
      <div className="rounded-[12px] border border-border bg-card divide-y divide-border/50">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3">
            <div className="min-w-0"><p className="font-medium truncate">{p.producto}</p><p className="text-xs text-muted-foreground">{p.categoria} {p.activo ? '' : '· inactivo'}</p></div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => { setEdit(p); setOpen(true); }}>Editar</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Eliminar</Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground p-3">Sin productos.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? 'Editar' : 'Nuevo'} producto</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Input placeholder="Nombre" value={edit.producto ?? ''} onChange={(e) => setEdit({ ...edit, producto: e.target.value })} />
              <Input placeholder="Categoría" value={edit.categoria ?? ''} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} />
              <div className="flex items-center gap-2"><Switch checked={!!edit.activo} onCheckedChange={(v) => setEdit({ ...edit, activo: v })} /><span className="text-sm">Activo</span></div>
              <Button onClick={save}>Guardar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** tsc + build. **Step 3: Commit** `feat(admin): productos CRUD tab`

---

### Task 8: Pestaña Conocimiento (CRUD con re-embedding)

**Files:** Create/replace `src/components/orders/admin/conocimiento-tab.tsx`

**Interfaces:** lista con `listKnowledge`, agrega/edita vía `fetch('/api/admin/knowledge', { method:'POST', body })` (re-embed server-side), borra vía `fetch(..., { method:'DELETE' })`.

- [ ] **Step 1: Implementar**

```tsx
// src/components/orders/admin/conocimiento-tab.tsx
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { listKnowledge } from '@/lib/admin-store';

export function ConocimientoTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = () => listKnowledge().then(setItems).catch(() => {});
  useEffect(() => { reload(); }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/knowledge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(edit) });
      if (!res.ok) throw new Error((await res.json()).error || 'error');
      setOpen(false); reload(); toast({ title: 'Conocimiento guardado', description: 'Re-indexado (embedding) OK.' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!confirm('¿Eliminar este conocimiento?')) return;
    try { const res = await fetch('/api/admin/knowledge', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error('error'); reload(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm text-muted-foreground">Información que el bot usa para responder (ubicación, políticas, etc.). Al guardar, se re-indexa automáticamente.</p>
      <Button size="sm" onClick={() => { setEdit({ contenido: '', categoria: '' }); setOpen(true); }}>+ Conocimiento</Button>
      <div className="rounded-[12px] border border-border bg-card divide-y divide-border/50">
        {items.map((k) => (
          <div key={k.id} className="flex items-start justify-between p-3 gap-3">
            <div className="min-w-0"><p className="text-sm truncate">{k.contenido}</p><p className="text-xs text-muted-foreground">{k.categoria}</p></div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => { setEdit(k); setOpen(true); }}>Editar</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(k.id)}>Eliminar</Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground p-3">Sin conocimiento.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? 'Editar' : 'Nuevo'} conocimiento</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Input placeholder="Categoría (ej: ubicacion)" value={edit.categoria ?? ''} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} />
              <Textarea placeholder="Contenido" rows={6} value={edit.contenido ?? ''} onChange={(e) => setEdit({ ...edit, contenido: e.target.value })} />
              <Button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** tsc + build (`npm run build`). **Step 3: Commit** `feat(admin): knowledge base CRUD tab (re-embedding)`

---

## Self-Review (cobertura vs §10 del spec)

- Prender/apagar bot (global + por contacto): Tasks 2 (store) + 5 (UI). ✓
- Editar system prompt: Tasks 2 + 6. ✓
- Gestionar conocimiento con re-embedding: Tasks 3 (route) + 8 (UI). ✓
- Gestionar productos: Tasks 2 + 7. ✓
- Gating a `admin`: nav `adminOnly` (Task 4) + bloque `isAdmin` en page.tsx + chequeo en la vista. ✓
- RLS para lectura/escritura del cliente: Task 1. ✓
- **Verificación:** lógica (admin-store, route) por Vitest; componentes por `tsc` + `npm run build` + smoke manual (el repo no testea componentes).
- **Seguridad (documentado):** escrituras/rutas heredan la postura actual (anon key + auth client-side). No se agrega auth server-side (fuera de alcance; es el problema conocido de la app).
- **Placeholder scan:** sin TBD. Los tabs se crean como placeholders en Task 4 y se llenan en 5-8.
```
