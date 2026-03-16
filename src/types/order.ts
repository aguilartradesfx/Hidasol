export type OrderStatus = 'Nueva' | 'En proceso' | 'Terminado';

export type CanalContacto = 'WhatsApp' | 'Instagram' | 'Facebook' | 'Sistema' | 'Correo';

export type MaterialPrincipal = 'Lona' | 'Vinil' | 'PVC' | 'Acrílico' | 'Poli' | 'Otros' | 'Estructura' | 'Formatos' | 'Plotter' | 'Corpóreos';

export type FormaPago = 'Contado' | 'Crédito' | 'Sin Factura';

export type TipoDiseno = 'Solo Impresión' | 'Diseño Nuevo' | 'Modificación' | 'Arte en sistema';

export type CorporeoOption = 'Chanelum' | 'Perfil' | 'Luz LED módulo' | 'Luz indirecta' | 'Fuente' | 'LED Infinito' | 'LED Neón' | 'Tira LED';

export type TipoCorporeo = 'Chanelum' | 'Perfil' | 'Led Infinito' | 'Led Neón' | 'Tira Led' | 'Luz Led-Módulo' | 'Luz indirecta';

export type MaterialCorporeo = 'PVC Negro' | 'PVC Blanco' | 'Acrílico Transparente' | 'Acrílico Color' | 'Acrílico Lechoso' | 'Tubo' | 'Lata' | 'ACM';

export type EstructuraCorporeo = 'Andamios' | 'Escalera' | 'Ninguna' | 'Tubo' | 'Lata' | 'ACM';

export type UnidadMedida = 'cm' | 'in';

export type MaquinaAsignada = 
  | 'Mimaki UCJV330' | 'Trotec Q500' | 'HP Latex' | 'Mimaki JFX200' 
  | 'Mimaki JV100' | 'Mimaki SWJ' | 'Mimaki UJV100' | 'Plotter 60' 
  | 'Plotter 135' | 'CNC JWEI' | 'Mimaki UJF-Promo' | 'DTF-Normal' | 'DTF-Neón';

export type Acabado =
  | 'Ojetes' | 'Ruedo' | 'Barnizado' | 'Laminado' | 'Plotter Normal'
  | 'Plotter Vaciado (Molde)' | 'Banderola' | 'Tubos y Tapones / Mecate'
  | 'Gráfica de Piso' | 'Transfer' | 'Vulcanizado' | 'Plantilla'
  | 'Roller Up' | 'Araña' | 'Coroplast' | 'Instalación' | 'Sin acabado'
  | 'Bloqueado' | 'Tipo espejo';

export const ACABADOS_OPTIONS: Acabado[] = [
  'Ojetes', 'Ruedo', 'Barnizado', 'Laminado', 'Plotter Normal',
  'Plotter Vaciado (Molde)', 'Banderola', 'Tubos y Tapones / Mecate',
  'Gráfica de Piso', 'Transfer', 'Vulcanizado', 'Plantilla',
  'Roller Up', 'Araña', 'Coroplast', 'Instalación', 'Sin acabado',
  'Bloqueado', 'Tipo espejo'
];

export const CORPOREO_MULTI_OPTIONS: CorporeoOption[] = [
  'Chanelum', 'Perfil', 'Luz LED módulo', 'Luz indirecta', 'Fuente', 'LED Infinito', 'LED Neón', 'Tira LED'
];

export const MATERIAL_TIPO_MAP: Record<string, string[]> = {
  'Lona': ['Normal', 'Traslúcida', 'Fotográfica', 'Blackout'],
  'PVC': ['Negro', 'Blanco'],
  'Acrílico': ['Transparente', 'Lechoso', 'Negro', 'Azul', 'Rojo', 'Amarillo', 'Verde', 'Otro'],
  'Poli': ['15mm', '30mm', '50mm', '80mm'],
  'Otros': ['Coroplast', 'Backlight', 'Plantilla'],
  'Estructura': ['Tubo 1×1', 'Tubo 2×2', 'Tubo 3×3', 'Tubo 4×4', 'Lata #26', 'Lata calibre 24', 'Seedcore', 'Aluminio compuesto', 'ACM'],
  'Vinil': ['Normal', 'Blackout', 'Transparente', 'Microperforado', 'Vehicular', 'Reflectivo', 'Sandblasting', 'Polarizado', 'Fotoluminiscente', 'Tornasol / Holográfico'],
  'Formatos': ['Magnético', 'Roller Up', 'Araña', 'Banderola', 'Banner'],
  'Plotter': ['Vaciado (Molde)', 'Normal', 'Laminado', 'Gráfica de Piso', 'Bloqueado', 'Tipo Espejo'],
  'Corpóreos': ['Chanelum', 'Perfil', 'Luz Led-Módulo', 'Luz Indirecta', 'Led Infinito', 'Led Neón', 'Fuente', 'Tira Led'],
};

// Conversion helpers
export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 100) / 100;
}

export function inchesToCm(inches: number): number {
  return Math.round((inches * 2.54) * 100) / 100;
}

export const MAQUINAS_OPTIONS: MaquinaAsignada[] = [
  'Mimaki UCJV330', 'Trotec Q500', 'HP Latex', 'Mimaki JFX200',
  'Mimaki JV100', 'Mimaki SWJ', 'Mimaki UJV100', 'Plotter 60',
  'Plotter 135', 'CNC JWEI', 'Mimaki UJF-Promo', 'DTF-Normal', 'DTF-Neón'
];

export interface Order {
  id: string;
  
  // Sección 1 — Información del Cliente
  cliente: string;
  contactoWhatsApp: string;
  correo: string;
  canalContacto: CanalContacto;
  realizadaPorCliente?: string; // Person inside client company who requested the job
  encargadoPor?: string; // Person responsible on our side (moved from Production)
  ubicacionCliente?: string; // Waze or Google Maps link
  
  // Sección 2 — Facturación
  formaPago: FormaPago;
  facturaElectronica: boolean;
  facturarANombreDe?: string;
  cedulaJuridica?: string;
  valorTotal: number;
  abono: number;
  incluirIVA: boolean;
  
  // Sección 3 — Info de la Orden
  estado: OrderStatus;
  fechaIngreso: Date;
  fechaLimite?: Date;
  productoNombre: string;
  productoId: string;
  tipoTrabajo: string;
  cantidad: number;
  
  // Sección 4 — Medidas y Material
  unidadMedida: UnidadMedida;
  alto: number;
  ancho: number;
  materialPrincipal: MaterialPrincipal;
  tipoMaterial: string;
  grosorMaterial?: string;
  colorMaterial?: string;
  instalacionTipo?: string;
  bannerDetalle?: string;
  
  // Impresión
  colorImpresion: string;
  tecnica: string;
  caras: string;
  
  // Acabados
  acabados: Acabado[];
  
  // Corpóreos (multi-select)
  corporeoTipo?: TipoCorporeo;
  corporeoMulti?: CorporeoOption[];
  corporeoColor?: string;
  corporeoFuente?: 'Si' | 'No';
  corporeoMaterial?: MaterialCorporeo;
  corporeoGrosor?: number;
  corporeoEstructura?: EstructuraCorporeo;
  colorManguera?: string;
  
  // Instalación
  requiereInstalacion: boolean;
  lugarInstalacion?: string;
  fechaEntrega?: Date;
  
  // Sección 5 — Diseño
  disenoListo: boolean;
  tipoDiseno?: TipoDiseno;
  disenadoPor?: string;
  fechaEnvioArte?: Date;
  fechaAprobacion?: Date;
  
  // Sección 6 — Producción
  maquinaAsignada?: MaquinaAsignada | MaquinaAsignada[];
  impresoPor?: string;
  realizadaPor?: string;
  finalizadoPor?: string;
  fechaImpresion?: Date;
  fechaIngresoRotulacion?: Date;
  fechaSalida?: Date;
  metrosImpresos?: number;
  metrosDesperdicio?: number;
  mlUsoTinta?: number;
  
  // Sección 7 — Notas
  especificaciones?: string;
  notasAdicionales?: string;

  // Campo oculto
  contactId?: string;
}

export function calcularSaldo(order: Order): number {
  return order.valorTotal - order.abono;
}

export function calcularMontoConIVA(order: Order): number {
  return order.incluirIVA ? order.valorTotal * 1.13 : order.valorTotal;
}

export interface OrdersGroupedByDate {
  [year: number]: {
    [month: number]: {
      [week: number]: {
        [day: string]: Order[];
      };
    };
  };
}

export interface DashboardStats {
  nueva: { count: number; change: number };
  enProceso: { count: number; change: number };
  terminado: { count: number; change: number };
}
