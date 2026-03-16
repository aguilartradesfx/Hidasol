"use client";

import { Order, OrderStatus, Acabado } from "@/types/order";
import { createClient } from "./supabase";

// Lazy-initialized client — ensures it's created in browser context
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// ============================================================
// MAPEO: Order (frontend) ↔ orders table (Supabase)
// ============================================================

function orderToRow(order: Order): Record<string, any> {
  return {
    order_id: order.id,
    cliente: order.cliente || "",
    contacto_whatsapp: order.contactoWhatsApp || "",
    email_cliente: order.correo || "",
    canal_contacto: order.canalContacto || "WhatsApp",
    estado: order.estado || "Nueva",
    fecha_ingreso: order.fechaIngreso
      ? new Date(order.fechaIngreso).toISOString()
      : new Date().toISOString(),
    producto_nombre: order.productoNombre || "",
    producto_id: order.productoId || "",
    tipo_trabajo: order.tipoTrabajo || "",
    cantidad: String(order.cantidad || 1),
    material: order.materialPrincipal || "Lona",
    tipo_material: order.tipoMaterial || "",
    alto_cm: String(order.alto || 0),
    ancho_cm: String(order.ancho || 0),
    color_impresion: order.colorImpresion || "",
    tecnica: order.tecnica || "",
    caras: order.caras || "",
    acabados: order.acabados ? order.acabados.join(", ") : "",
    corporeos: order.corporeoTipo || null,
    corporeos_multi: order.corporeoMulti ? order.corporeoMulti.join(", ") : null,
    corporeo_color: order.corporeoColor || null,
    corporeo_fuente: order.corporeoFuente || null,
    corporeo_material: order.corporeoMaterial || null,
    corporeo_grosor:
      order.corporeoGrosor != null ? String(order.corporeoGrosor) : null,
    estructura: order.corporeoEstructura || null,
    instalacion: order.requiereInstalacion ? "true" : "false",
    lugar_instalacion: order.lugarInstalacion || null,
    fecha_entrega: order.fechaEntrega
      ? new Date(order.fechaEntrega).toISOString()
      : null,
    fecha_limite: order.fechaLimite
      ? new Date(order.fechaLimite).toISOString()
      : null,
    color_manguera: order.colorManguera || null,
    diseno_listo: order.disenoListo,
    tipo_diseno: order.tipoDiseno || null,
    disenado_por: order.disenadoPor || null,
    fecha_envio_arte: order.fechaEnvioArte
      ? new Date(order.fechaEnvioArte).toISOString()
      : null,
    fecha_aprobacion: order.fechaAprobacion
      ? new Date(order.fechaAprobacion).toISOString()
      : null,
    maquina: order.maquinaAsignada || null,
    encargado_por: order.encargadoPor || null,
    impreso_por: order.impresoPor || null,
    realizada_por: order.realizadaPor || null,
    finalizado_por: order.finalizadoPor || null,
    fecha_impresion: order.fechaImpresion
      ? new Date(order.fechaImpresion).toISOString()
      : null,
    fecha_ingreso_rotulacion: order.fechaIngresoRotulacion
      ? new Date(order.fechaIngresoRotulacion).toISOString()
      : null,
    fecha_salida: order.fechaSalida
      ? new Date(order.fechaSalida).toISOString()
      : null,
    mts_impresos:
      order.metrosImpresos != null ? String(order.metrosImpresos) : null,
    mts_desperdicio:
      order.metrosDesperdicio != null ? String(order.metrosDesperdicio) : null,
    ml_tinta: order.mlUsoTinta != null ? String(order.mlUsoTinta) : null,
    forma_pago: order.formaPago || "Contado",
    factura_electronica: order.facturaElectronica ? "true" : "false",
    empresa_factura: order.facturarANombreDe || null,
    cedula_juridica: order.cedulaJuridica || null,
    valor: order.valorTotal || 0,
    abono: order.abono || 0,
    saldo: (order.valorTotal || 0) - (order.abono || 0),
    iva: order.incluirIVA || false,
    especificaciones: order.especificaciones || null,
    notas: order.notasAdicionales || null,
    realizada_por_cliente: order.realizadaPorCliente || null,
    ubicacion_cliente: order.ubicacionCliente || null,
    unidad_medida: order.unidadMedida || "cm",
    contact_id: order.contactId || "manual-ui",
  };
}

// Normalize estado from DB (might be lowercase "nueva" → "Nueva")
function normalizeEstado(val: string | null | undefined): string {
  if (!val) return "Nueva";
  const map: Record<string, string> = {
    nueva: "Nueva",
    "en proceso": "En proceso",
    en_proceso: "En proceso",
    terminado: "Terminado",
  };
  return map[val.toLowerCase()] ?? val;
}

function rowToOrder(row: any): Order {
  const acabadosStr: string = row.acabados || "";
  const acabadosArr: Acabado[] = acabadosStr
    ? (acabadosStr
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean) as Acabado[])
    : [];

  const corporeoMultiStr: string = row.corporeos_multi || "";
  const corporeoMultiArr = corporeoMultiStr
    ? corporeoMultiStr.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return {
    id: row.order_id,
    cliente: row.cliente || "",
    contactoWhatsApp: row.contacto_whatsapp || "",
    correo: row.email_cliente || "",
    canalContacto: row.canal_contacto || "WhatsApp",
    realizadaPorCliente: row.realizada_por_cliente || undefined,
    encargadoPor: row.encargado_por || undefined,
    ubicacionCliente: row.ubicacion_cliente || undefined,
    estado: normalizeEstado(row.estado) as OrderStatus,
    fechaIngreso: row.fecha_ingreso ? new Date(row.fecha_ingreso) : new Date(),
    productoNombre: row.producto_nombre || "",
    productoId: row.producto_id || "",
    tipoTrabajo: row.tipo_trabajo || "",
    cantidad: Number(row.cantidad) || 1,
    unidadMedida: row.unidad_medida || "cm",
    materialPrincipal: row.material || "Lona",
    tipoMaterial: row.tipo_material || "",
    alto: Number(row.alto_cm) || 0,
    ancho: Number(row.ancho_cm) || 0,
    colorImpresion: row.color_impresion || "",
    tecnica: row.tecnica || "",
    caras: row.caras || "",
    acabados: acabadosArr,
    corporeoTipo: row.corporeos || undefined,
    corporeoMulti: corporeoMultiArr.length > 0 ? corporeoMultiArr : undefined,
    corporeoColor: row.corporeo_color || undefined,
    corporeoFuente: (row.corporeo_fuente as 'Si' | 'No') || undefined,
    corporeoMaterial: row.corporeo_material || undefined,
    corporeoGrosor: row.corporeo_grosor
      ? Number(row.corporeo_grosor)
      : undefined,
    corporeoEstructura: row.estructura || undefined,
    requiereInstalacion: row.instalacion === "true" || row.instalacion === true,
    lugarInstalacion: row.lugar_instalacion || undefined,
    fechaEntrega: row.fecha_entrega ? new Date(row.fecha_entrega) : undefined,
    fechaLimite: row.fecha_limite ? new Date(row.fecha_limite) : undefined,
    colorManguera: row.color_manguera || undefined,
    disenoListo: row.diseno_listo || false,
    tipoDiseno: row.tipo_diseno || undefined,
    disenadoPor: row.disenado_por || undefined,
    fechaEnvioArte: row.fecha_envio_arte
      ? new Date(row.fecha_envio_arte)
      : undefined,
    fechaAprobacion: row.fecha_aprobacion
      ? new Date(row.fecha_aprobacion)
      : undefined,
    maquinaAsignada: row.maquina || undefined,
    impresoPor: row.impreso_por || undefined,
    realizadaPor: row.realizada_por || undefined,
    finalizadoPor: row.finalizado_por || undefined,
    fechaImpresion: row.fecha_impresion
      ? new Date(row.fecha_impresion)
      : undefined,
    fechaIngresoRotulacion: row.fecha_ingreso_rotulacion
      ? new Date(row.fecha_ingreso_rotulacion)
      : undefined,
    fechaSalida: row.fecha_salida ? new Date(row.fecha_salida) : undefined,
    metrosImpresos: row.mts_impresos ? Number(row.mts_impresos) : undefined,
    metrosDesperdicio: row.mts_desperdicio
      ? Number(row.mts_desperdicio)
      : undefined,
    mlUsoTinta: row.ml_tinta ? Number(row.ml_tinta) : undefined,
    formaPago: row.forma_pago || "Contado",
    facturaElectronica:
      row.factura_electronica === "true" || row.factura_electronica === true,
    facturarANombreDe: row.empresa_factura || undefined,
    cedulaJuridica: row.cedula_juridica || undefined,
    valorTotal: row.valor || 0,
    abono: row.abono || 0,
    incluirIVA: row.iva || false,
    especificaciones: row.especificaciones || undefined,
    notasAdicionales: row.notas || undefined,
    contactId: row.contact_id || undefined,
  };
}

// ============================================================
// ORDER ID GENERATION: ORD-YYMMDD-NNN
// ============================================================

export async function generateOrderIdFromDB(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const datePrefix = `ORD-${yy}${mm}${dd}`;

  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .like("order_id", `${datePrefix}-%`);

  if (error) {
    console.error("Error generating order ID:", error);
  }

  const seq = (count ?? 0) + 1;
  const generatedId = `${datePrefix}-${String(seq).padStart(3, "0")}`;
  console.log("Generated order ID:", generatedId, "from count:", count);
  return generatedId;
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

export async function loadOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  console.log("[loadOrders] Starting fetch...");

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("[loadOrders] Response - Error:", error);
  console.log("[loadOrders] Response - Data count:", data?.length || 0);
  console.log("[loadOrders] Raw data:", JSON.stringify(data, null, 2));

  if (error) {
    console.error("Error loading orders:", error);
    return [];
  }

  const orders = (data || []).map(rowToOrder);
  console.log(
    "[loadOrders] Converted orders:",
    JSON.stringify(
      orders.map((o) => ({ id: o.id, estado: o.estado, cliente: o.cliente })),
      null,
      2,
    ),
  );
  return orders;
}

export async function loadRecentOrders(limit: number = 5): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error loading recent orders:", error);
    return [];
  }

  return (data || []).map(rowToOrder);
}

export async function loadOrderCounts(): Promise<{
  nueva: number;
  enProceso: number;
  terminado: number;
}> {
  const supabase = getSupabase();
  const [nuevaRes, procesoRes, terminadoRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .ilike("estado", "nueva"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .ilike("estado", "en proceso"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .ilike("estado", "terminado"),
  ]);

  return {
    nueva: nuevaRes.count ?? 0,
    enProceso: procesoRes.count ?? 0,
    terminado: terminadoRes.count ?? 0,
  };
}

export async function addOrder(
  order: Order,
): Promise<{ order: Order | null; error: string | null }> {
  const row = orderToRow(order);
  const supabase = getSupabase();

  console.log("Attempting to insert order with ID:", order.id);
  console.log("Row to insert:", JSON.stringify(row, null, 2));

  const { data, error } = await supabase
    .from("orders")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Error adding order:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
    return { order: null, error: `${error.message} (${error.code})` };
  }

  console.log("Order inserted successfully:", data);
  return { order: rowToOrder(data), error: null };
}

export async function updateOrderInDB(
  orderId: string,
  order: Order,
): Promise<{ order: Order | null; error: string | null }> {
  const row = orderToRow(order);
  // Remove order_id from update payload since it's the PK
  delete row.order_id;
  const supabase = getSupabase();

  console.log("[updateOrderInDB] Updating order:", orderId);
  console.log("[updateOrderInDB] Payload:", JSON.stringify(row, null, 2));

  const { data, error } = await supabase
    .from("orders")
    .update(row)
    .eq("order_id", orderId)
    .select()
    .single();

  if (error) {
    console.error(
      "[updateOrderInDB] Supabase error:",
      JSON.stringify(error, null, 2),
    );
    return { order: null, error: `${error.message} (${error.code})` };
  }

  if (!data) {
    console.error(
      "[updateOrderInDB] No data returned — row may not exist for order_id:",
      orderId,
    );
    return {
      order: null,
      error: `No se encontró la orden ${orderId} en la base de datos.`,
    };
  }

  console.log("[updateOrderInDB] Success:", data.order_id);
  return { order: rowToOrder(data), error: null };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<boolean> {
  const supabase = getSupabase();
  console.log("[updateOrderStatus] Updating", orderId, "to", newStatus);

  const { error } = await supabase
    .from("orders")
    .update({ estado: newStatus })
    .eq("order_id", orderId);

  if (error) {
    console.error(
      "[updateOrderStatus] Supabase error:",
      JSON.stringify(error, null, 2),
    );
    return false;
  }

  console.log("[updateOrderStatus] Success");
  return true;
}

export async function updateDisenadoPor(
  orderId: string,
  value: string,
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("orders")
    .update({ disenado_por: value || null })
    .eq("order_id", orderId);

  if (error) {
    console.error("Error updating disenado_por:", error);
    return false;
  }

  return true;
}

// ============================================================
// REALTIME SUBSCRIPTION
// ============================================================

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const supabase = getSupabase();
  // Remove any existing channel with the same name first to avoid duplicates
  supabase.getChannels().forEach((ch) => {
    if (ch.topic === "realtime:public:orders") {
      supabase.removeChannel(ch);
    }
  });

  const channel = supabase
    .channel("realtime:public:orders")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      async () => {
        const orders = await loadOrders();
        callback(orders);
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders" },
      async () => {
        const orders = await loadOrders();
        callback(orders);
      },
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "orders" },
      async () => {
        const orders = await loadOrders();
        callback(orders);
      },
    )
    .subscribe((status) => {
      console.log("[Realtime] orders subscription status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
