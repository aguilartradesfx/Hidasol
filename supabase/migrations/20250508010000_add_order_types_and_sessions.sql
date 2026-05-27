-- Tipo de orden: Rotulacion (default) | Sellos | Papeleria
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tipo_orden TEXT DEFAULT 'Rotulacion';

-- Campos Sellos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tipo_sello TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS modelo_sello TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS espacio_diseno TEXT;

-- Campos compartidos Sellos + Papelería
ALTER TABLE orders ADD COLUMN IF NOT EXISTS descuento_aplicado BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC DEFAULT 0;

-- Campos Papelería
ALTER TABLE orders ADD COLUMN IF NOT EXISTS trabajo TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS factura_no TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS facturado_el TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hecha_por TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS atendido_por TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS codigo_cliente TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS muestra BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS color_tinta TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS color_tinta_otro TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tipo_arte TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS numerado_por TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS empacado_por TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coleccionado_por TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refilado_por TEXT;

-- Tabla de sesiones de trabajo para diseñadores (timer play/pause)
CREATE TABLE IF NOT EXISTS design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  designer_id TEXT NOT NULL,
  total_elapsed_ms BIGINT NOT NULL DEFAULT 0,
  timer_start TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'idle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, designer_id)
);

ALTER TABLE design_sessions DISABLE ROW LEVEL SECURITY;

-- Habilitar Realtime en design_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE design_sessions;
