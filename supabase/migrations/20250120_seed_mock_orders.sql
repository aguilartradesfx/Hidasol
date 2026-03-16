-- Mock data seed for Hidasol demo
-- Covers current month + last 2 months with varied statuses, clients, and products

INSERT INTO orders (
  order_id, cliente, contacto_whatsapp, email_cliente, canal_contacto, estado,
  fecha_ingreso, producto_nombre, producto_id, tipo_trabajo, cantidad,
  material, tipo_material, alto_cm, ancho_cm, color_impresion,
  tecnica, caras, acabados, maquina, encargado_por, impreso_por,
  forma_pago, factura_electronica, valor, abono, saldo, iva,
  especificaciones, notas, contact_id,
  fecha_entrega, diseno_listo, tipo_diseno, disenado_por,
  instalacion, lugar_instalacion
) VALUES

-- ─── ENERO 2025 ────────────────────────────────────────────────────────────

-- Semana 1 – 6 Jan
('ORD-250106-001', 'Farmacia La Salud', '8899-1122', 'farmacia@lasalud.cr', 'WhatsApp', 'Terminado',
 '2025-01-06 08:30:00', 'Rótulo Lona Exterior', 'PROD-001', 'Impresión', 2,
 'Lona', 'Normal', 80, 200, 'Full Color',
 'Impresión UV', 'Una cara', 'Ojetes, Ruedo', 'HP Latex', 'Carlos M.', 'Luis A.',
 'Contado', false, 85000, 85000, 0, false,
 'Colores corporativos: verde y blanco', 'Cliente frecuente, entrega urgente', 'manual-ui',
 '2025-01-08 17:00:00', true, 'Solo Impresión', 'Ana G.',
 'false', null),

('ORD-250106-002', 'Supermercado Don Carlos', '7733-4455', 'compras@doncarlos.cr', 'Correo', 'Terminado',
 '2025-01-06 10:00:00', 'Banner Promocional', 'PROD-002', 'Impresión', 5,
 'Lona', 'Traslúcida', 60, 150, 'Full Color',
 'Impresión Solvente', 'Dos caras', 'Ruedo, Tubos y Tapones / Mecate', 'Mimaki JV100', 'María R.', 'Pedro S.',
 'Crédito', true, 175000, 100000, 75000, true,
 'Logos de ofertas semanales', null, 'manual-ui',
 '2025-01-10 12:00:00', true, 'Modificación', 'Juan D.',
 'false', null),

-- Semana 1 – 7 Jan
('ORD-250107-001', 'Constructora Horizonte', '6644-7788', 'proyectos@horizonte.cr', 'Sistema', 'Terminado',
 '2025-01-07 09:15:00', 'Valla Publicitaria', 'PROD-003', 'Impresión', 1,
 'Lona', 'Fotográfica', 300, 600, 'Full Color',
 'Impresión UV', 'Una cara', 'Ojetes', 'HP Latex', 'Carlos M.', 'Luis A.',
 'Crédito', true, 420000, 200000, 220000, true,
 'Gran formato para obra en construcción', 'Requiere grúa para instalación', 'manual-ui',
 '2025-01-14 08:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'true', 'Av. Central, frente a plaza'),

-- Semana 2 – 13 Jan
('ORD-250113-001', 'Restaurante La Terraza', '8811-2233', 'info@laterraza.cr', 'Instagram', 'Terminado',
 '2025-01-13 11:30:00', 'Menú Digital Impreso', 'PROD-004', 'Impresión', 10,
 'PVC', 'Blanco', 60, 40, 'Full Color',
 'Impresión UV', 'Dos caras', 'Barnizado, Laminado', 'Mimaki UJF-Promo', 'María R.', 'Pedro S.',
 'Contado', false, 65000, 65000, 0, false,
 'Plastificado mate en ambas caras', 'Menús plastificados lavables', 'manual-ui',
 '2025-01-15 17:00:00', true, 'Modificación', 'Juan D.',
 'false', null),

('ORD-250113-002', 'Auto Taller Pérez', '7722-9900', 'taller@perez.cr', 'WhatsApp', 'Terminado',
 '2025-01-13 14:00:00', 'Rotulación Vehicular', 'PROD-005', 'Ploteo', 1,
 'Vinil', 'Vehicular', 120, 350, 'Full Color',
 'Plotter de corte', 'Una cara', 'Plotter Normal, Instalación', 'Plotter 60', 'Carlos M.', 'Luis A.',
 'Contado', false, 95000, 95000, 0, false,
 'Camión de reparto, vinil 3M', null, 'manual-ui',
 '2025-01-17 09:00:00', false, 'Diseño Nuevo', 'Ana G.',
 'true', 'Taller del cliente'),

-- Semana 2 – 15 Jan
('ORD-250115-001', 'Clínica Dental Sonrisa', '8866-5544', 'citas@sonrisa.cr', 'Correo', 'Terminado',
 '2025-01-15 08:45:00', 'Rótulo LED Corpóreo', 'PROD-006', 'Corpóreo', 1,
 'Corpóreos', 'Chanelum', 40, 200, 'Blanco / Azul',
 'LED', 'Una cara', 'Instalación', 'CNC JWEI', 'María R.', 'Pedro S.',
 'Crédito', true, 680000, 340000, 340000, true,
 'Letras tipo Chanelum iluminadas, color azul neón', 'Instalar en fachada, 4 metros de altura', 'manual-ui',
 '2025-01-25 10:00:00', true, 'Diseño Nuevo', 'Juan D.',
 'true', 'Clínica, Av. 2da'),

-- Semana 3 – 20 Jan
('ORD-250120-001', 'Eventos & Bodas Marcela', '8855-6677', 'marcela@eventos.cr', 'Instagram', 'Terminado',
 '2025-01-20 10:00:00', 'Fondo Fotográfico', 'PROD-007', 'Impresión', 3,
 'Lona', 'Fotográfica', 200, 300, 'Full Color',
 'Impresión UV', 'Una cara', 'Ruedo, Tubos y Tapones / Mecate', 'HP Latex', 'Carlos M.', 'Luis A.',
 'Contado', false, 240000, 240000, 0, false,
 'Diseño floral, colores pastel', 'Para boda el 25 de enero', 'manual-ui',
 '2025-01-23 12:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'false', null),

('ORD-250120-002', 'Librería El Saber', '8844-3322', 'compras@elsaber.cr', 'WhatsApp', 'Terminado',
 '2025-01-20 13:30:00', 'Vitrina con Vinil Sandblasting', 'PROD-008', 'Ploteo', 6,
 'Vinil', 'Sandblasting', 100, 80, 'Mate',
 'Plotter de corte', 'Una cara', 'Plotter Normal', 'Plotter 135', 'María R.', 'Pedro S.',
 'Contado', false, 48000, 48000, 0, false,
 'Patrón geométrico repetido', null, 'manual-ui',
 '2025-01-22 17:00:00', true, 'Solo Impresión', 'Juan D.',
 'false', null),

-- Semana 4 – 27 Jan
('ORD-250127-001', 'Hotel Playa Dorada', '7700-1155', 'marketing@playadorada.cr', 'Sistema', 'Terminado',
 '2025-01-27 09:00:00', 'Señalética Interior', 'PROD-009', 'Impresión', 15,
 'PVC', 'Blanco', 20, 30, 'Full Color',
 'Impresión UV', 'Una cara', 'Barnizado', 'Mimaki JFX200', 'Carlos M.', 'Luis A.',
 'Crédito', true, 135000, 135000, 0, false,
 'Señalización de habitaciones y áreas comunes', 'Numeración del 101 al 115', 'manual-ui',
 '2025-01-31 17:00:00', true, 'Modificación', 'Ana G.',
 'false', null),

-- ─── FEBRERO 2025 ──────────────────────────────────────────────────────────

-- Semana 1 – 3 Feb
('ORD-250203-001', 'Tienda Deportiva Sprint', '8833-7766', 'ventas@sprint.cr', 'WhatsApp', 'Terminado',
 '2025-02-03 08:00:00', 'Camisetas DTF', 'PROD-010', 'Impresión', 24,
 'Otros', 'Backlight', 30, 25, 'Full Color',
 'DTF', 'Una cara', 'Transfer', 'DTF-Normal', 'María R.', 'Pedro S.',
 'Contado', false, 96000, 96000, 0, false,
 'Logo equipo de fútbol, talla M y L', null, 'manual-ui',
 '2025-02-07 17:00:00', true, 'Solo Impresión', 'Juan D.',
 'false', null),

('ORD-250203-002', 'Pizzería Napoli', '7788-4433', 'pedidos@napoli.cr', 'Instagram', 'Terminado',
 '2025-02-03 10:30:00', 'Rótulo Exterior Vinil', 'PROD-011', 'Impresión', 1,
 'Vinil', 'Normal', 60, 180, 'Full Color',
 'Impresión Solvente', 'Una cara', 'Laminado', 'Mimaki JV100', 'Carlos M.', 'Luis A.',
 'Contado', false, 52000, 52000, 0, false,
 'Fondo rojo, letras amarillas estilo italiano', null, 'manual-ui',
 '2025-02-05 12:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'false', null),

-- Semana 1 – 5 Feb
('ORD-250205-001', 'Instituto Tecnológico CENFOTEC', '8822-5599', 'comunicacion@cenfotec.ac.cr', 'Correo', 'Terminado',
 '2025-02-05 14:00:00', 'Roll-Up Institucional', 'PROD-012', 'Impresión', 4,
 'Formatos', 'Roller Up', 200, 85, 'Full Color',
 'Impresión UV', 'Una cara', 'Roller Up', 'Mimaki UCJV330', 'María R.', 'Pedro S.',
 'Crédito', true, 240000, 240000, 0, true,
 'Diseño institucional con colores CENFOTEC', 'Para feria universitaria feb 15', 'manual-ui',
 '2025-02-12 17:00:00', true, 'Modificación', 'Juan D.',
 'false', null),

-- Semana 2 – 10 Feb
('ORD-250210-001', 'Inmobiliaria Castillo', '7711-8899', 'ventas@castillo.cr', 'WhatsApp', 'Terminado',
 '2025-02-10 09:30:00', 'Rótulo Bienes Raíces', 'PROD-013', 'Impresión', 8,
 'Lona', 'Normal', 60, 90, 'Full Color',
 'Impresión Solvente', 'Una cara', 'Ojetes', 'HP Latex', 'Carlos M.', 'Luis A.',
 'Crédito', false, 120000, 60000, 60000, false,
 '"Se vende" y "En preventa", logo corporativo', null, 'manual-ui',
 '2025-02-14 17:00:00', true, 'Solo Impresión', 'Ana G.',
 'false', null),

('ORD-250210-002', 'Salón de Belleza Estilo', '8800-3344', 'citas@estilo.cr', 'Instagram', 'Terminado',
 '2025-02-10 11:00:00', 'Vinil Decorativo Interior', 'PROD-014', 'Ploteo', 1,
 'Vinil', 'Normal', 150, 250, 'Full Color',
 'Plotter de corte', 'Una cara', 'Plotter Normal, Laminado', 'Plotter 60', 'María R.', 'Pedro S.',
 'Contado', false, 78000, 78000, 0, false,
 'Mural floral para pared de recepción', 'Superficie estucada, usar adhesivo extra', 'manual-ui',
 '2025-02-13 17:00:00', true, 'Diseño Nuevo', 'Juan D.',
 'true', 'Local del cliente'),

-- Semana 3 – 17 Feb
('ORD-250217-001', 'Ferretería Nacional', '7799-0022', 'pedidos@ferreteria.cr', 'Sistema', 'Terminado',
 '2025-02-17 08:00:00', 'Banners de Oferta', 'PROD-015', 'Impresión', 6,
 'Lona', 'Normal', 80, 120, 'Full Color',
 'Impresión Solvente', 'Una cara', 'Ojetes, Ruedo', 'Mimaki JV100', 'Carlos M.', 'Luis A.',
 'Crédito', true, 132000, 132000, 0, true,
 'Promociones de temporada', 'Urgente para apertura de tienda', 'manual-ui',
 '2025-02-20 08:00:00', true, 'Modificación', 'Ana G.',
 'false', null),

-- Semana 3 – 19 Feb
('ORD-250219-001', 'Universidad Latina', '8877-6655', 'comunicacion@ulatina.cr', 'Correo', 'Terminado',
 '2025-02-19 13:00:00', 'Araña Publicitaria', 'PROD-016', 'Impresión', 2,
 'Formatos', 'Araña', 200, 200, 'Full Color',
 'Impresión UV', 'Una cara', 'Araña', 'Mimaki UCJV330', 'María R.', 'Pedro S.',
 'Crédito', true, 180000, 90000, 90000, true,
 'Diseño institucional ULatina', 'Para graduaciones marzo 2025', 'manual-ui',
 '2025-02-28 17:00:00', true, 'Modificación', 'Juan D.',
 'false', null),

-- Semana 4 – 24 Feb
('ORD-250224-001', 'Farmacia San Rafael', '8866-1100', 'info@farmaciasanrafael.cr', 'WhatsApp', 'Terminado',
 '2025-02-24 09:00:00', 'Rótulo Corpóreo LED', 'PROD-017', 'Corpóreo', 1,
 'Corpóreos', 'Led Neón', 30, 180, 'Verde Neon',
 'LED Neón', 'Una cara', 'Instalación', 'CNC JWEI', 'Carlos M.', 'Luis A.',
 'Contado', false, 520000, 520000, 0, false,
 'Nombre "Farmacia San Rafael" en neón verde', 'Instalar sobre ventana principal', 'manual-ui',
 '2025-03-05 10:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'true', 'Local San Rafael de Heredia'),

-- ─── MARZO 2025 ────────────────────────────────────────────────────────────

-- Semana 1 – 3 Mar
('ORD-250303-001', 'Café Bohemia', '8855-2211', 'hola@cafebohemia.cr', 'Instagram', 'Terminado',
 '2025-03-03 10:00:00', 'Pizarra Vinil Blackout', 'PROD-018', 'Ploteo', 3,
 'Vinil', 'Blackout', 80, 60, 'Negro',
 'Plotter de corte', 'Una cara', 'Plotter Normal', 'Plotter 135', 'María R.', 'Pedro S.',
 'Contado', false, 36000, 36000, 0, false,
 'Efecto pizarra para menú diario', null, 'manual-ui',
 '2025-03-05 17:00:00', true, 'Solo Impresión', 'Juan D.',
 'false', null),

('ORD-250303-002', 'Gym FitMax', '7744-8866', 'gym@fitmax.cr', 'WhatsApp', 'Terminado',
 '2025-03-03 14:30:00', 'Gráfica de Piso', 'PROD-019', 'Ploteo', 1,
 'Vinil', 'Gráfica de Piso', 500, 600, 'Full Color',
 'Impresión + Laminado antideslizante', 'Una cara', 'Gráfica de Piso, Laminado', 'Mimaki UCJV330', 'Carlos M.', 'Luis A.',
 'Contado', false, 185000, 185000, 0, false,
 'Logo gym en área de pesas, anti-resbalante certificado', null, 'manual-ui',
 '2025-03-07 12:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'true', 'Gimnasio FitMax'),

-- Semana 1 – 5 Mar
('ORD-250305-001', 'Banco Popular', '2200-0000', 'marketing@bpop.fi.cr', 'Sistema', 'Terminado',
 '2025-03-05 08:00:00', 'Señalética Sucursal', 'PROD-020', 'Impresión', 30,
 'Acrílico', 'Lechoso', 20, 30, 'Full Color',
 'Impresión UV', 'Una cara', 'Barnizado', 'Mimaki JFX200', 'María R.', 'Pedro S.',
 'Crédito', true, 450000, 225000, 225000, true,
 'Manual corporativo banco popular, numeración de ventanillas', 'Urgente para renovación de imagen', 'manual-ui',
 '2025-03-12 17:00:00', true, 'Solo Impresión', 'Juan D.',
 'false', null),

-- Semana 2 – 10 Mar
('ORD-250310-001', 'Óptica Visión Clara', '8833-9977', 'citas@visionclara.cr', 'WhatsApp', 'En proceso',
 '2025-03-10 09:30:00', 'Rótulo Acrílico Corpóreo', 'PROD-021', 'Corpóreo', 1,
 'Corpóreos', 'Perfil', 50, 300, 'Azul / Blanco',
 'CNC + LED', 'Una cara', 'Instalación', 'CNC JWEI', 'Carlos M.', null,
 'Crédito', true, 750000, 375000, 375000, true,
 'Letras en perfil de aluminio retroiluminadas', 'Instalación en fachada de vidrio', 'manual-ui',
 '2025-03-20 10:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'true', 'Local Óptica, Centro Comercial'),

-- Semana 2 – 12 Mar
('ORD-250312-001', 'Escuela Primaria Jesús Jiménez', '8811-7766', 'direccion@jesusjimenez.ed.cr', 'Correo', 'En proceso',
 '2025-03-12 10:00:00', 'Mural Educativo Vinil', 'PROD-022', 'Impresión', 5,
 'Vinil', 'Normal', 150, 200, 'Full Color',
 'Impresión UV', 'Una cara', 'Laminado', 'Mimaki UCJV330', 'María R.', null,
 'Crédito', false, 325000, 100000, 225000, false,
 'Mapamundi, sistema solar y abecedario', 'Materiales no tóxicos para aula', 'manual-ui',
 '2025-03-21 17:00:00', true, 'Diseño Nuevo', 'Juan D.',
 'false', null),

-- Semana 2 – 14 Mar
('ORD-250314-001', 'Agencia de Viajes Explora', '7766-3311', 'info@explora.cr', 'Instagram', 'En proceso',
 '2025-03-14 11:00:00', 'Stand Ferial Completo', 'PROD-023', 'Impresión', 1,
 'Lona', 'Fotográfica', 250, 400, 'Full Color',
 'Impresión UV', 'Dos caras', 'Ojetes, Ruedo, Araña', 'HP Latex', 'Carlos M.', null,
 'Crédito', true, 580000, 290000, 290000, true,
 'Stand para Expo Turismo 2025', 'Debe incluir estructura metálica', 'manual-ui',
 '2025-03-22 08:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'false', null),

-- Semana 3 – 17 Mar
('ORD-250317-001', 'Heladería Tropical', '8822-4455', 'pedidos@tropical.cr', 'WhatsApp', 'En proceso',
 '2025-03-17 08:30:00', 'Menú de Pared Gran Formato', 'PROD-024', 'Impresión', 2,
 'Vinil', 'Normal', 120, 180, 'Full Color',
 'Impresión UV', 'Una cara', 'Laminado, Plotter Normal', 'Mimaki UCJV330', 'María R.', null,
 'Contado', false, 95000, 47500, 47500, false,
 'Menú con fotos de helados, fondo azul cielo', null, 'manual-ui',
 '2025-03-21 17:00:00', false, 'Diseño Nuevo', 'Juan D.',
 'false', null),

('ORD-250317-002', 'Municipalidad de Desamparados', '2259-0000', 'comunicacion@munides.go.cr', 'Sistema', 'En proceso',
 '2025-03-17 14:00:00', 'Vallas Informativas', 'PROD-025', 'Impresión', 4,
 'Lona', 'Blackout', 200, 300, 'Full Color',
 'Impresión Solvente', 'Dos caras', 'Ojetes', 'HP Latex', 'Carlos M.', null,
 'Crédito', true, 480000, 0, 480000, true,
 'Información de obras en curso, año 2025', 'Resistencia UV para exteriores', 'manual-ui',
 '2025-03-25 08:00:00', true, 'Diseño Nuevo', 'Ana G.',
 'false', null),

-- Semana 3 – 19 Mar
('ORD-250319-001', 'Grupo Empresarial Alfa', '8800-5566', 'gerencia@grupoalfa.cr', 'Correo', 'En proceso',
 '2025-03-19 09:00:00', 'Rotulación de Flota', 'PROD-026', 'Ploteo', 3,
 'Vinil', 'Vehicular', 100, 300, 'Full Color',
 'Plotter de corte', 'Dos caras', 'Plotter Normal, Instalación', 'Plotter 135', 'María R.', null,
 'Crédito', true, 285000, 142500, 142500, true,
 '3 camiones de reparto, diseño unificado', 'Coordinar con encargado de flota', 'manual-ui',
 '2025-03-26 17:00:00', true, 'Modificación', 'Juan D.',
 'true', 'Taller Grupo Alfa'),

-- Semana 4 – 24 Mar
('ORD-250324-001', 'Colegio Técnico Profesional CTP', '8877-2233', 'directora@ctpsanramon.ed.cr', 'Correo', 'Nueva',
 '2025-03-24 10:00:00', 'Galería Fotográfica Impresa', 'PROD-027', 'Impresión', 20,
 'Lona', 'Fotográfica', 50, 75, 'Full Color',
 'Impresión UV', 'Una cara', 'Barnizado', 'Mimaki JFX200', null, null,
 'Crédito', false, 180000, 0, 180000, false,
 'Fotos de actividades estudiantiles 2024', 'Para exposición anual del colegio', 'manual-ui',
 '2025-03-31 17:00:00', false, 'Solo Impresión', null,
 'false', null),

-- Semana 4 – 25 Mar (hoy aprox.)
('ORD-250325-001', 'Distribuidora Ramírez & Hijos', '8844-6677', 'ventas@ramirez.cr', 'WhatsApp', 'Nueva',
 '2025-03-25 08:15:00', 'Rótulo Exterior Lona', 'PROD-028', 'Impresión', 1,
 'Lona', 'Normal', 100, 300, 'Full Color',
 'Impresión UV', 'Una cara', 'Ojetes, Ruedo', null, null, null,
 'Contado', false, 145000, 0, 145000, false,
 'Logo en azul marino con fondo blanco', 'Primer pedido del cliente', 'manual-ui',
 '2025-03-28 17:00:00', false, 'Diseño Nuevo', null,
 'false', null),

('ORD-250325-002', 'Centro Médico Santa Fe', '2290-1234', 'administracion@santafe.cr', 'Sistema', 'Nueva',
 '2025-03-25 09:45:00', 'Señalética Completa', 'PROD-029', 'Impresión', 25,
 'Acrílico', 'Transparente', 15, 25, 'Full Color',
 'Impresión UV', 'Una cara', 'Barnizado', null, null, null,
 'Crédito', true, 375000, 0, 375000, true,
 'Sistema de señalización para clínica nueva', 'Incluir señalética de emergencias según norma', 'manual-ui',
 '2025-04-04 17:00:00', false, 'Diseño Nuevo', null,
 'false', null),

('ORD-250325-003', 'Panadería El Trigo Dorado', '8811-4422', 'pedido@triigodorado.cr', 'Instagram', 'Nueva',
 '2025-03-25 11:00:00', 'Vitrina Vinil Frosted', 'PROD-030', 'Ploteo', 2,
 'Vinil', 'Sandblasting', 90, 120, 'Mate',
 'Plotter de corte', 'Una cara', 'Plotter Normal', null, null, null,
 'Contado', false, 58000, 0, 58000, false,
 'Efecto esmerilado para mostrador de vidrio', null, 'manual-ui',
 '2025-03-27 17:00:00', true, 'Solo Impresión', null,
 'false', null),

-- Semana 4 – 26 Mar
('ORD-250326-001', 'Mueblería Roble Fino', '7733-8866', 'contacto@roblefino.cr', 'WhatsApp', 'Nueva',
 '2025-03-26 08:00:00', 'Catálogo Impreso A4', 'PROD-031', 'Impresión', 100,
 'Otros', 'Backlight', 30, 21, 'Full Color',
 'Impresión UV', 'Dos caras', 'Barnizado, Laminado', 'Mimaki JFX200', null, null,
 'Crédito', true, 320000, 0, 320000, true,
 'Catálogo de productos 2025, 20 páginas', 'Encuadernación engrapada', 'manual-ui',
 '2025-04-02 17:00:00', true, 'Modificación', 'Ana G.',
 'false', null)

ON CONFLICT (order_id) DO NOTHING;
