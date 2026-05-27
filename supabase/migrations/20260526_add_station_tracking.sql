-- ============================================================
-- STATION TRACKING (Fase 1)
-- Adds station-based workflow to orders so every user can see
-- which department currently holds the order, where it came from,
-- and the full movement history.
-- ============================================================

-- 1) Columns on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estacion_actual   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estacion_anterior TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estacion_desde    TIMESTAMPTZ;

-- 2) History table (one row per station transition)
CREATE TABLE IF NOT EXISTS order_station_history (
  id              BIGSERIAL PRIMARY KEY,
  order_id        TEXT NOT NULL,
  estacion_desde  TEXT,
  estacion_hasta  TEXT NOT NULL,
  movida_por_id   TEXT,
  movida_por_name TEXT,
  movida_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notas           TEXT,
  CONSTRAINT fk_history_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_station_history_order_id
  ON order_station_history(order_id);
CREATE INDEX IF NOT EXISTS idx_station_history_movida_en
  ON order_station_history(movida_en DESC);
CREATE INDEX IF NOT EXISTS idx_orders_estacion_actual
  ON orders(estacion_actual);

-- 3) RLS (match existing permissive policy used elsewhere)
ALTER TABLE order_station_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on station history" ON order_station_history;
CREATE POLICY "Allow all operations on station history"
  ON order_station_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE order_station_history;

-- 5) Backfill existing orders
-- Rule:
--   estado = 'Terminado'                   -> Bodega
--   impreso_por IS NOT NULL                -> Acabados   (already printed, in finishing flow)
--   diseno_listo = true                    -> Corte e impresión
--   disenado_por IS NOT NULL               -> Diseño
--   otherwise                              -> Recepción
-- fecha_ingreso is stored as TEXT (ISO string) — cast safely.
UPDATE orders
SET estacion_actual = CASE
    WHEN LOWER(COALESCE(estado, '')) = 'terminado'    THEN 'Bodega'
    WHEN impreso_por IS NOT NULL                       THEN 'Acabados'
    WHEN diseno_listo = TRUE                           THEN 'Corte e impresión'
    WHEN disenado_por IS NOT NULL                      THEN 'Diseño'
    ELSE 'Recepción'
  END,
  estacion_desde = COALESCE(
    estacion_desde,
    CASE WHEN fecha_ingreso IS NOT NULL AND fecha_ingreso <> ''
         THEN fecha_ingreso::timestamptz
         ELSE NULL END,
    NOW()
  )
WHERE estacion_actual IS NULL;

-- 6) Seed history with one entry per existing order (the backfilled landing)
INSERT INTO order_station_history (order_id, estacion_desde, estacion_hasta, movida_por_name, movida_en, notas)
SELECT
  o.order_id,
  NULL,
  o.estacion_actual,
  'Sistema (backfill)',
  COALESCE(
    CASE WHEN o.fecha_ingreso IS NOT NULL AND o.fecha_ingreso <> ''
         THEN o.fecha_ingreso::timestamptz
         ELSE NULL END,
    NOW()
  ),
  'Backfill inicial de estaciones'
FROM orders o
LEFT JOIN order_station_history h ON h.order_id = o.order_id
WHERE o.estacion_actual IS NOT NULL
  AND h.id IS NULL;
