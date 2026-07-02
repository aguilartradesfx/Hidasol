# Spec — Agente de WhatsApp nativo (reemplazo de n8n)

**Fecha:** 2026-07-01
**Estado:** diseño aprobado (pendiente revisión final del usuario)

## 1. Objetivo

Reemplazar el agente de WhatsApp que hoy corre en n8n (`Hidasol - Agent Unificado v2`, 36 nodos, en `n8n-n8n.hnxvzj.easypanel.host`) por una implementación **nativa** dentro de este repo, sobre **Next.js (Vercel) + Supabase**, sin depender de n8n ni de easypanel. GoHighLevel (GHL) se mantiene como canal de WhatsApp y CRM.

**Motivación:** independencia de n8n (fragilidad, pausas del proyecto Supabase que dejaron el bot muerto ~5 semanas), todo versionado y testeable en git, control desde el panel de admin.

## 2. No-objetivos (YAGNI)

- No inbox de chat en vivo ni respuesta manual desde el panel.
- No cambiar el proveedor de WhatsApp (sigue GHL).
- No migrar el historial viejo de `langchain_chat_histories` (la memoria arranca limpia).
- No versionado de prompt (`bot_config_history`) en el MVP.
- No worker/servidor persistente (todo serverless en Vercel + Supabase).

## 3. Arquitectura

```
GHL (WhatsApp + CRM)  ⇄  Next.js en Vercel (API routes)  ⇄  Supabase (Postgres)
                              │                                   │
                              ├─ Anthropic (Claude 4.5: agente + visión)   pg_cron + pg_net
                              └─ OpenAI (Whisper audio + embeddings RAG)
```

- **El agente corre solo en Vercel** (API routes). El panel escribe configuración en Supabase; el agente la lee en cada mensaje.
- **Supabase = fuente única de verdad**, compartida por app, panel y agente.
- **Debounce sin servidor persistente:** `pg_cron` (cada 1 min) despierta el procesamiento vía `pg_net` (HTTP POST a Vercel). Ninguna función serverless "duerme".
- **Monorepo:** el agente vive en el mismo repo (rutas bajo `src/app/api/wa/*` + librería bajo `src/lib/agent/*`), compartiendo tipos (`Order`, tipos de Supabase).

## 4. Componentes y flujo

**① `POST /api/wa/webhook`** — recibe el mensaje de GHL (rápido, sin IA)
1. Valida el request (header/secreto compartido con GHL).
2. Trae el contacto de GHL (`GET /contacts/{id}`) y evalúa el **gate on/off** (§5). Si el bot está apagado para ese contacto, ignora.
3. Inserta el mensaje en `message_buffer` (`processed=false`).
4. Responde **200 inmediato** a GHL y la función termina.

**② `pg_cron` (cada 1 min) + `pg_net`** — el "despertador" del debounce
- Selecciona `contact_id` distintos con mensajes en buffer cuyo **último mensaje tenga ≥30s**.
- Para cada uno, `net.http_post()` a `/api/wa/process` con `{contact_id}` y un secreto (`PROCESS_SECRET`).
- También recupera buffers viejos no procesados (recovery sweep, §13).

**③ `POST /api/wa/process`** — trabajo pesado (IA), `export const maxDuration = 300`
5. **Reclama** los mensajes del contacto atómicamente (`UPDATE message_buffer SET processed=true WHERE contact_id=$1 AND processed=false RETURNING *`) → idempotencia ante solapamiento del cron.
6. **Normaliza + multimodal** (§7).
7. Carga **sesión** (`datos_utiles`), **memoria** (`agent_messages`) y **config** (`bot_config`).
8. Corre el **loop del agente** (§6).
9. **Parsea la salida** por tags → decide acción (§6).
10. **Ejecuta acción** (§9).
11. **Persiste**: memoria (turno user + assistant), `datos_utiles` de la sesión, y `agent_logs`.

**Módulos aislados y testeables:** `webhook`, `debounce` (SQL), `processor`, `multimodal`, `agent`, `tools`, `actions`, `memory/session/log`.

## 5. Gate on/off del bot (3 fuentes)

El bot responde **solo si**:
- `bot_config.bot_enabled = true` (**kill switch global**, desde el panel), **Y**
- el contacto **no** tiene el tag GHL `bot_desactivado` (lo usa el equipo hoy; se consulta en cada mensaje), **Y**
- `sessions.estado_bot` ≠ apagado (por contacto).

**Handoff cierra el hueco:** cuando el agente emite `[HANDOFF]`, además de poner el tag `human handoff` en GHL (comportamiento actual), **apaga el bot de forma confiable** para ese contacto: pone el tag `bot_desactivado` en GHL **y** `sessions.estado_bot='off'`. (En n8n el handoff solo ponía `human handoff`, que el `IF` no chequeaba → el bot podía seguir respondiendo. Aquí se corrige.)

## 6. Runtime del agente

- **Modelo:** Claude **Sonnet 4.5** (`claude-sonnet-4-5-20250929`) vía SDK de Anthropic (`@anthropic-ai/sdk`), con loop de **tool use** (model → tool calls → tool results → … → texto final).
- **System prompt:** se lee de `bot_config.system_prompt` (editable en el panel). Seed inicial = el prompt actual del nodo `AI Agent Unificado` (recopilar datos para cotizar; no vende, no da precios, no confirma órdenes; 1 pregunta por mensaje; tono con tuteo). Se inyecta contexto del contacto (nombre/teléfono/email/canal) y `datos_utiles` previos.
- **Prompt caching:** se cachean system prompt + definiciones de tools (estáticos) para bajar costo de tokens.
- **Tools:**
  - `buscar_producto(termino)` → `SELECT buscar_producto($1)` (función SQL existente sobre `productos`).
  - `listar_productos(categoria)` → `SELECT listar_productos($1)`.
  - `buscar_orden(numero)` → `SELECT ... FROM orders WHERE order_id ILIKE '%'||$1||'%' ...`.
  - `knowledge_base(pregunta)` → embed de la pregunta (OpenAI, 1536) → RPC `match_documents` sobre `knowledge_chunks_view`.
- **Parser de salida** (replica `Parse Agent Output`): busca en el texto final:
  - `ORDEN_COMPLETA` + bloque `{…}` → parsea JSON → acción crear orden.
  - `[PRODUCTO_ESPECIAL]` → acción especial.
  - `[HANDOFF]` → acción handoff.
  - si nada → mensaje normal.

## 7. Multimodal

- **Texto:** concatena los mensajes del buffer en orden.
- **Audio:** descarga el media (URL de GHL) → **OpenAI Whisper** transcribe → texto.
- **Imagen:** se pasa directo a **Claude (visión)** como parte del contenido del mensaje. Se **elimina** la llamada de visión de OpenAI que había en n8n (una integración menos).
- **Embeddings del RAG:** **OpenAI `text-embedding-3-small`** (1536 dims), para coincidir con los 90 vectores existentes en `knowledge_chunks` (`vector(1536)`).

## 8. Modelo de datos

**Se reusa tal cual:** `orders`, `sessions` (`datos_utiles`, `estado`, `estado_bot`), `message_buffer`, `knowledge_chunks` + `knowledge_chunks_view`, `productos`; RPC `match_documents`; funciones `buscar_producto()`, `listar_productos()`.

**Nuevas:**

```sql
-- Configuración editable desde el panel; el agente la lee en cada corrida.
CREATE TABLE bot_config (
  id            int PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- fila única
  bot_enabled   boolean NOT NULL DEFAULT true,
  system_prompt text NOT NULL,
  model         text NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  temperature   real NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    text
);

-- Memoria nativa de la conversación (reemplaza langchain_chat_histories).
CREATE TABLE agent_messages (
  id         bigserial PRIMARY KEY,
  contact_id text NOT NULL,
  role       text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_messages_contact ON agent_messages(contact_id, id);

-- Observabilidad.
CREATE TABLE agent_logs (
  id          bigserial PRIMARY KEY,
  contact_id  text,
  input       text,
  output      text,
  action      text,            -- mensaje | orden_completa | handoff | producto_especial | error
  tools_used  jsonb,
  tokens_in   int,
  tokens_out  int,
  latency_ms  int,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**Debounce (pg_cron + pg_net):**
```sql
-- extensiones: pg_cron, pg_net (habilitar en Supabase)
-- Cada minuto: despierta contactos con buffer inactivo >=30s.
SELECT cron.schedule('wa-debounce', '* * * * *', $$
  SELECT net.http_post(
    url := '<APP_URL>/api/wa/process',
    headers := jsonb_build_object('content-type','application/json','x-process-secret','<PROCESS_SECRET>'),
    body := jsonb_build_object('contact_id', b.contact_id)
  )
  FROM (
    SELECT contact_id
    FROM message_buffer
    WHERE processed = false
    GROUP BY contact_id
    HAVING max(created_at) <= now() - interval '30 seconds'
  ) b;
$$);
```

**Se retiran (sin borrar datos):** `langchain_chat_histories` (la reemplaza `agent_messages`).

## 9. Acciones / integración GHL

Endpoints GHL (base `https://services.leadconnectorhq.com`, header `Version: 2021-07-28`, `Authorization: Bearer <GHL_TOKEN>`):
- **Enviar:** `POST /conversations/messages` (`type=WhatsApp`, `contactId`, `message`).
- **Get contact:** `GET /contacts/{id}` (tags para el gate).
- **Tags:** `POST /contacts/{id}/tags` (`human handoff`, `producto especial`, `bot_desactivado`).
- **Crear orden** (`ORDEN_COMPLETA`): mapea el JSON del agente a la tabla `orders` **reusando `order-store.ts`** y respetando el invariante de `elementos` (`syncPrimaryElemento`: `elementos[0]` ↔ campos planos). Luego envía el mensaje de cierre y avisa al equipo.
- **Avisos al equipo** (orden creada / handoff / especial): se replican textualmente de los nodos `Mensaje Orden Creada`, `Mensaje Handoff`, `Mensaje Especial` del JSON.

## 10. Panel del superadmin

Sección nueva en el panel de admin, **gated al rol `admin`** (el más alto existente). Escribe a Supabase; el agente lee esos cambios en cada corrida (efecto inmediato, sin redeploy).

- **(a) Prender/apagar bot:** switch global (`bot_config.bot_enabled`) + lista de overrides por contacto (`sessions.estado_bot`).
- **(b) Editor de system prompt:** textarea grande → guarda en `bot_config.system_prompt` (+ `updated_by`, `updated_at`).
- **(c) Gestor de conocimiento:** CRUD sobre `knowledge_chunks` (contenido + categoría). **Al guardar, re-genera el embedding** (OpenAI 1536) vía una API route del servidor.
- **(d) Gestor de productos:** CRUD sobre `productos` (usado por `buscar_producto`/`listar_productos`).

## 11. Seguridad y secretos

- **Env vars server-side** (nunca al browser): `GHL_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`/pooler creds, `WA_WEBHOOK_SECRET`, `PROCESS_SECRET`, `APP_URL`.
- **Conexión a Supabase** desde serverless: por el **pooler** (transaction, `aws-1-us-east-2.pooler.supabase.com:6543`, user `postgres.<ref>`) o PostgREST — nunca conexión directa (que es IPv6-only y rompió el bot antes).
- **`/api/wa/webhook`** valida secreto compartido con GHL; **`/api/wa/process`** exige `x-process-secret` (lo llama `pg_net`).
- **El archivo `Hidasol - Agent Unificado v2.json`** contiene el token GHL en texto plano → se agrega a `.gitignore`, **no se commitea**, se **borra** al terminar la migración, y se **rota** el token GHL.

## 12. Escala / NFRs

Objetivo de planeación: **100 conversaciones/día (~1.000 mensajes/día)**, ~10× el volumen histórico real (67 msg/día). Margen holgado:
- Vercel Pro (1.000 GB-h incl.): uso estimado ~30–60 GB-h/mes.
- Supabase: escrituras triviales; conexiones por pooler.
- Anthropic ~2 llamadas/min promedio (muy por debajo de rate limits); costo de tokens = igual que n8n, reducible con prompt caching.
- **Tiers de producción recomendados:** Vercel Pro + Supabase Pro (uso comercial, backups, sin auto-pausa).

## 13. Manejo de errores y recuperación

- **Ack inmediato** al webhook (GHL no reintenta de más).
- **Claim idempotente** del buffer (§4.5) evita doble-envío.
- **Recovery sweep:** el `pg_cron` también agarra buffers no procesados antiguos (si una corrida de `/process` murió a mitad).
- **Reintentos con backoff** en llamadas a GHL / Anthropic / OpenAI.
- **Timeout del agente:** si excede `maxDuration` o falla el loop, **fallback a `[HANDOFF]`** (nunca dejar al cliente sin respuesta) + log en `agent_logs`.
- **Dead-letter:** mensajes que fallan N veces se marcan y se avisa al equipo.

## 14. Testing

- **Unit:** tools SQL, parser de salida (tags), lógica del gate on/off, normalizador multimodal, mapeo `ORDEN_COMPLETA` → `Order`.
- **Integración:** `webhook → buffer → process` contra una Supabase de prueba; agente con Anthropic (respuestas mockeadas y una corrida real de bajo costo).
- **E2E:** contacto de prueba en GHL, mensaje real → respuesta real.
- Se sigue `superpowers:test-driven-development` para cada módulo.

## 15. Migración / cutover

- **Fase A — DB:** migraciones (tablas nuevas, `pg_cron`, `pg_net`), seed de `bot_config` con el prompt actual del n8n.
- **Fase B — Deploy:** implementar endpoints en Vercel con las env vars.
- **Fase C — Prueba:** contacto/número de prueba apuntando el webhook al endpoint nativo; validar flujo completo (texto, audio, imagen, orden, handoff, tag).
- **Fase D — Cutover:** cambiar el webhook de GHL de n8n → `/api/wa/webhook`.
- **Fase E — Cierre:** monitorear; apagar el workflow de n8n y easypanel; borrar el JSON; rotar el token GHL.
- **Rollback:** revertir el webhook de GHL a n8n (el workflow queda importable).

## 16. Fases de implementación (para el plan)

1. DB + `bot_config`/`agent_messages`/`agent_logs` + secrets/env.
2. `webhook` + buffer + gate on/off + ack.
3. `pg_cron`/`pg_net` debounce + `processor` (esqueleto) + claim idempotente.
4. Agente: loop Claude + tools SQL + RAG.
5. Multimodal (Whisper + visión Claude).
6. Acciones (enviar GHL, crear orden, handoff con apagado, especial, avisos).
7. Panel superadmin (on/off, prompt, conocimiento con re-embed, productos).
8. Migración/cutover + hardening (errores, reintentos, recovery, dead-letter).

## 17. Ítems abiertos a confirmar

- **Rol del panel:** se usa `admin` (el más alto existente). ¿Se quiere un rol `superadmin`/`master` dedicado y distinto de los admins normales?
- **Token GHL** `pit-…`: confirmar vigencia / rotarlo.
- **Textos exactos** de mensajes de sistema (orden creada, handoff, especial): se copian de los nodos del JSON durante la implementación.
