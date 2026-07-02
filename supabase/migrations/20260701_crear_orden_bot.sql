-- supabase/migrations/20260701_crear_orden_bot.sql
CREATE OR REPLACE FUNCTION crear_orden_bot(p jsonb) RETURNS text AS $$
DECLARE
  new_id text;
BEGIN
  -- Serializa la generación del correlativo diario para evitar order_id duplicados
  -- bajo llamadas concurrentes (serverless). El lock se libera al terminar la transacción.
  PERFORM pg_advisory_xact_lock(hashtext('crear_orden_bot'));

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
