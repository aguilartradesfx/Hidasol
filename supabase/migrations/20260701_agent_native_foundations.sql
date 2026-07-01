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
