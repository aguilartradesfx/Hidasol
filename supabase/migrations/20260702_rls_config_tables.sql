-- El panel del superadmin lee/escribe estas tablas con el cliente browser (anon key),
-- consistente con orders/sessions. RLS off (idempotente).
ALTER TABLE IF EXISTS public.productos        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.knowledge_chunks DISABLE ROW LEVEL SECURITY;
-- bot_config / agent_messages / agent_logs / sessions ya tienen RLS off de migraciones previas.
