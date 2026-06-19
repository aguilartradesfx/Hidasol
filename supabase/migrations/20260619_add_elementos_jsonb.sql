-- Multi-elemento: permite varios trabajos en una sola orden.
-- Columna aditiva y anulable; las órdenes existentes quedan con NULL y se
-- leen como un único elemento derivado de las columnas planas.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS elementos jsonb;
