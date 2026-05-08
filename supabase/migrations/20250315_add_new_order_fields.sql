-- Add new columns for the updated order form
-- "realizada_por_cliente" = who inside the client company requested the job
-- "ubicacion_cliente" = Google Maps / Waze link
-- "unidad_medida" = cm or in
-- "corporeos_multi" = multi-select corporeo options as comma-separated text

ALTER TABLE orders ADD COLUMN IF NOT EXISTS realizada_por_cliente TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ubicacion_cliente TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'cm';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS corporeos_multi TEXT;
