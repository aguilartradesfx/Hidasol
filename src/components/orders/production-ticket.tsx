import { Order, calcularSaldo, calcularMontoConIVA, getElementos } from '@/types/order';
import { formatCurrency, formatDate } from '@/lib/order-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface ProductionTicketProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function field(label: string, value: string | number | boolean | undefined | null, mono = false) {
  if (value === undefined || value === null || value === '' || value === false) return '';
  const v = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value);
  return `<div><div class="field-label">${label}</div><div class="${mono ? 'field-value-mono' : 'field-value'}">${v}</div></div>`;
}

function section(title: string, content: string) {
  if (!content.replace(/<div><\/div>/g, '').trim()) return '';
  return `<div class="section"><div class="section-title">${title}</div><div class="grid-auto">${content}</div></div>`;
}

function pill(label: string) {
  return `<span class="pill">${label}</span>`;
}

// ─── main component ────────────────────────────────────────────────────────────
export function ProductionTicket({ order, isOpen, onClose }: ProductionTicketProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const safeOrderId = order?.id ?? '';

  const handlePrint = useCallback(() => {
    if (!order || !printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=820,height=1200');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Boleta - ${safeOrderId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Newsreader', serif; font-size: 11px; line-height: 1.4; color: #000; background: #fff; padding: 14px; }
    h1, h2, h3, .section-title { font-family: 'Bricolage Grotesque', sans-serif; }
    .font-mono, .field-value-mono, .order-id { font-family: 'JetBrains Mono', monospace; }
    .ticket-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
    .ticket-header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .ticket-header .subtitle { font-size: 11px; font-weight: 600; }
    .order-id { font-size: 16px; font-weight: 800; }
    .order-date { font-size: 9px; color: #555; margin-top: 2px; }
    .tipo-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1.5px solid #000; margin-bottom: 6px; }
    .status-badge { display: inline-block; padding: 4px 18px; border-radius: 6px; font-weight: 800; font-size: 12px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .status-nueva { background: #60A5FA; color: #1E3A8A; }
    .status-proceso { background: #F97316; color: #fff; }
    .status-terminado { background: #34D399; color: #065F46; }
    .section { border: 1px solid #000; border-radius: 5px; padding: 6px 8px; margin-bottom: 7px; }
    .section-title { font-size: 10px; font-weight: 800; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px 10px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 7px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; margin-bottom: 7px; }
    .field-label { font-size: 9px; font-weight: 600; color: #555; }
    .field-value { font-size: 11px; font-weight: 700; word-break: break-word; }
    .field-value-mono { font-size: 10px; font-weight: 700; word-break: break-all; }
    .pills { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 2px; }
    .pill { display: inline-block; padding: 2px 7px; border: 1px solid #000; border-radius: 999px; font-size: 9px; font-weight: 600; }
    .valores-section { border: 2px solid #000; border-radius: 5px; padding: 8px; margin-bottom: 7px; background: #f5f5f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .valor-row { display: flex; justify-content: space-between; align-items: center; padding: 2px 0; font-size: 11px; }
    .valor-row.total { border-top: 1.5px solid #000; padding-top: 5px; margin-top: 3px; font-size: 13px; font-weight: 900; }
    .firmas-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-top: 14px; }
    .firma-line { border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; font-weight: 600; }
    .footer { text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ccc; padding-top: 5px; margin-top: 8px; }
    .footer .mono { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 11px; color: #000; }
    .notas-box { background: #f9f9f9; border: 1px solid #000; border-radius: 5px; padding: 6px 8px; margin-bottom: 7px; font-size: 11px; white-space: pre-wrap; }
    @media print { body { padding: 0; } @page { margin: 0.5cm; size: letter portrait; } }
  </style>
</head>
<body>${printContent}</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 600);
  }, [order, safeOrderId]);

  if (!order) return null;

  const saldo = calcularSaldo(order);
  const montoConIVA = calcularMontoConIVA(order);
  const statusClass = order.estado === 'Nueva' ? 'status-nueva' : order.estado === 'En proceso' ? 'status-proceso' : 'status-terminado';
  const tipoLabel = order.tipoOrden === 'Sellos' ? 'SELLOS' : order.tipoOrden === 'Papeleria' ? 'PAPELERÍA' : 'ROTULACIÓN';

  // ── Build print HTML sections ────────────────────────────────────────────────
  const clienteHtml = `
    ${field('Nombre', order.cliente)}
    ${field('WhatsApp', order.contactoWhatsApp, true)}
    ${field('Correo', order.correo, true)}
    ${field('Canal', order.canalContacto)}
    ${field('Solicita / Realizado por', order.realizadaPorCliente)}
    ${field('Encargado por', order.encargadoPor)}
    ${field('Atendido por', order.atendidoPor)}
    ${field('Código cliente', order.codigoCliente, true)}
    ${order.ubicacionCliente ? `<div style="grid-column:1/-1"><div class="field-label">Ubicación</div><div class="field-value-mono" style="font-size:9px">${order.ubicacionCliente}</div></div>` : ''}
  `;

  const ordenHtml = `
    ${field('Tipo', tipoLabel)}
    ${field('Estado', order.estado)}
    ${field('Fecha ingreso', formatDate(order.fechaIngreso))}
    ${order.fechaLimite ? field('Fecha límite', formatDate(order.fechaLimite)) : ''}
    ${field('Producto', order.productoNombre)}
    ${field('Producto ID', order.productoId, true)}
    ${field('Tipo de trabajo', order.tipoTrabajo)}
    ${field('Cantidad', order.cantidad)}
  `;

  // Sellos-specific
  const sellosHtml = order.tipoOrden === 'Sellos' ? `
    ${field('Tipo de sello', order.tipoSello)}
    ${field('Modelo', order.modeloSello)}
    ${order.espacioDiseno ? `<div style="grid-column:1/-1"><div class="field-label">Espacio para Diseño</div><div class="field-value" style="white-space:pre-wrap;min-height:40px;border:1px solid #ccc;padding:4px">${order.espacioDiseno}</div></div>` : ''}
  ` : '';

  // Papelería-specific
  const papeleriaHtml = order.tipoOrden === 'Papeleria' ? `
    ${field('Trabajo', order.trabajo)}
    ${field('Tipo de impresión', order.tecnica)}
    ${field('Color de tinta', order.colorTinta === 'Otro' ? `Otro: ${order.colorTintaOtro}` : order.colorTinta)}
    ${field('Tipo de arte', order.tipoArte)}
    ${field('Muestra', order.muestra)}
    ${field('Factura No', order.facturaNo, true)}
    ${field('Facturar a nombre de', order.facturarANombreDe)}
    ${order.facturadoEl ? field('Facturado el', formatDate(order.facturadoEl)) : ''}
  ` : '';

  // Rotulación material/medidas
  const materialHtml = order.tipoOrden === 'Rotulacion' ? `
    ${field('Material', `${order.materialPrincipal}${order.tipoMaterial ? ' — ' + order.tipoMaterial : ''}`)}
    ${field('Alto', `${order.alto} ${order.unidadMedida || 'cm'}`)}
    ${field('Ancho', `${order.ancho} ${order.unidadMedida || 'cm'}`)}
    ${field('Color / Impresión', order.colorImpresion)}
    ${field('Técnica', order.tecnica)}
    ${field('Caras', order.caras)}
    ${order.grosorMaterial ? field('Grosor', order.grosorMaterial) : ''}
    ${order.colorMaterial ? field('Color material', order.colorMaterial) : ''}
    ${order.instalacionTipo ? field('Instalación tipo', order.instalacionTipo) : ''}
  ` : '';

  const acabadosHtml = order.tipoOrden === 'Rotulacion' && order.acabados && order.acabados.length > 0
    ? `<div class="section"><div class="section-title">Acabados</div><div class="pills">${order.acabados.map(a => pill(a)).join('')}</div></div>`
    : '';

  const corporeoHtml = order.tipoOrden === 'Rotulacion' && (order.corporeoMulti?.length || order.corporeoTipo) ? `
    ${order.corporeoMulti?.length ? `<div style="grid-column:1/-1"><div class="field-label">Corpóreos</div><div class="pills" style="margin-top:3px">${order.corporeoMulti.map(c => pill(c)).join('')}</div></div>` : ''}
    ${field('Color corpóreo', order.corporeoColor)}
    ${field('Fuente', order.corporeoFuente)}
    ${field('Material corpóreo', order.corporeoMaterial)}
    ${order.corporeoGrosor ? field('Grosor corpóreo', `${order.corporeoGrosor} mm`) : ''}
    ${field('Estructura', order.corporeoEstructura)}
    ${field('Color manguera', order.colorManguera)}
  ` : '';

  const instalacionHtml = order.tipoOrden === 'Rotulacion' ? `
    ${field('Requiere instalación', order.requiereInstalacion)}
    ${order.requiereInstalacion ? field('Lugar', order.lugarInstalacion) : ''}
    ${order.fechaEntrega ? field('Fecha entrega', formatDate(order.fechaEntrega)) : ''}
  ` : '';

  const disenoHtml = `
    ${field('Diseño listo', order.disenoListo)}
    ${field('Tipo de diseño', order.tipoDiseno || order.tipoArte)}
    ${field('Diseñado por', order.disenadoPor)}
    ${order.fechaEnvioArte ? field('Fecha envío arte', formatDate(order.fechaEnvioArte)) : ''}
    ${order.fechaAprobacion ? field('Fecha aprobación', formatDate(order.fechaAprobacion)) : ''}
  `;

  const produccionHtml = `
    ${field('Máquina', Array.isArray(order.maquinaAsignada) ? order.maquinaAsignada.join(', ') : order.maquinaAsignada)}
    ${field('Impreso por', order.impresoPor)}
    ${field('Realizado por', order.realizadaPor)}
    ${field('Finalizado por', order.finalizadoPor)}
    ${order.tipoOrden === 'Papeleria' ? field('Numerado por', order.numeradoPor) : ''}
    ${order.tipoOrden === 'Papeleria' ? field('Empacado por', order.empacadoPor) : ''}
    ${order.tipoOrden === 'Papeleria' ? field('Coleccionado por', order.coleccionadoPor) : ''}
    ${order.tipoOrden === 'Papeleria' ? field('Refilado por', order.refiladoPor) : ''}
    ${order.fechaImpresion ? field('Fecha impresión', formatDate(order.fechaImpresion)) : ''}
    ${order.fechaIngresoRotulacion ? field('Ingreso rotulación', formatDate(order.fechaIngresoRotulacion)) : ''}
    ${order.fechaSalida ? field('Fecha salida', formatDate(order.fechaSalida)) : ''}
    ${order.metrosImpresos != null ? field('Metros impresos', `${order.metrosImpresos} m`) : ''}
    ${order.metrosDesperdicio != null ? field('Metros desperdicio', `${order.metrosDesperdicio} m`) : ''}
    ${order.mlUsoTinta != null ? field('ML tinta', `${order.mlUsoTinta} ml`) : ''}
  `;

  const facturacionHtml = `
    ${field('Forma de pago', order.formaPago)}
    ${field('Factura electrónica', order.facturaElectronica)}
    ${order.facturaElectronica ? field('A nombre de', order.facturarANombreDe) : ''}
    ${order.facturaElectronica ? field('Cédula jurídica', order.cedulaJuridica) : ''}
    ${order.descuentoAplicado ? field('Descuento', formatCurrency(order.descuentoMonto || 0)) : ''}
  `;

  const printBody = `
    <div class="ticket-header">
      <div>
        <h1>HIDASOL</h1>
        <div class="subtitle">Orden de Producción</div>
      </div>
      <div style="text-align:right">
        <div class="order-id">${order.id}</div>
        <div class="order-date">${formatDate(order.fechaIngreso)}</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span class="tipo-badge">${tipoLabel}</span>
      <span class="status-badge ${statusClass}">${order.estado.toUpperCase()}</span>
    </div>

    ${section('Cliente', clienteHtml)}
    ${section('Información de la Orden', ordenHtml)}
    ${order.tipoOrden === 'Sellos' ? section('Sello', sellosHtml) : ''}
    ${order.tipoOrden === 'Papeleria' ? section('Indicaciones de Impresión', papeleriaHtml) : ''}
    ${order.tipoOrden === 'Rotulacion' ? section('Material y Medidas', materialHtml) : ''}
    ${acabadosHtml}
    ${corporeoHtml ? section('Corpóreos', corporeoHtml) : ''}
    ${order.tipoOrden === 'Rotulacion' && (order.requiereInstalacion || order.fechaEntrega) ? section('Instalación', instalacionHtml) : ''}
    ${section('Diseño', disenoHtml)}
    ${section('Producción', produccionHtml)}
    ${section('Facturación', facturacionHtml)}

    <div class="valores-section">
      <div class="section-title">Valores</div>
      <div class="valor-row"><span>Valor Total:</span><span class="field-value-mono">${formatCurrency(order.valorTotal)}</span></div>
      ${order.incluirIVA ? `<div class="valor-row"><span>IVA (13%):</span><span class="field-value-mono">${formatCurrency(montoConIVA - order.valorTotal)}</span></div>` : ''}
      ${order.incluirIVA ? `<div class="valor-row"><span>Total con IVA:</span><span class="field-value-mono">${formatCurrency(montoConIVA)}</span></div>` : ''}
      <div class="valor-row"><span>Abono:</span><span class="field-value-mono">${formatCurrency(order.abono)}</span></div>
      <div class="valor-row total"><span>SALDO:</span><span class="field-value-mono">${formatCurrency(saldo)}</span></div>
    </div>

    ${(order.especificaciones || order.notasAdicionales) ? `
      <div style="margin-bottom:7px">
        <div class="section-title" style="margin-bottom:4px">NOTAS / ESPECIFICACIONES</div>
        ${order.especificaciones ? `<div class="notas-box">${order.especificaciones}</div>` : ''}
        ${order.notasAdicionales ? `<div class="notas-box">${order.notasAdicionales}</div>` : ''}
      </div>
    ` : ''}

    ${order.tipoOrden === 'Sellos' && order.espacioDiseno ? `
      <div style="margin-bottom:7px">
        <div class="section-title" style="margin-bottom:4px">ESPACIO PARA DISEÑO</div>
        <div style="border:1.5px solid #000;border-radius:4px;min-height:80px;padding:6px;white-space:pre-wrap;font-size:11px">${order.espacioDiseno}</div>
      </div>
    ` : ''}

    <div class="firmas-row">
      <div class="firma-line">Operario / Diseñador</div>
      <div class="firma-line">Supervisor / Revisado</div>
    </div>

    <div class="footer">
      <div class="mono">${order.id}</div>
    </div>
  `;

  // ── Preview helpers ──────────────────────────────────────────────────────────
  const getStatusBg = () => {
    switch (order.estado) {
      case 'Nueva': return 'bg-[#60A5FA] text-[#1E3A8A]';
      case 'En proceso': return 'bg-[#F97316] text-white';
      case 'Terminado': return 'bg-[#34D399] text-[#065F46]';
    }
  };

  function PreviewField({ label, value, mono = false }: { label: string; value?: string | number | boolean | null; mono?: boolean }) {
    if (value === undefined || value === null || value === '' || value === false) return null;
    const v = typeof value === 'boolean' ? 'Sí' : String(value);
    return (
      <div>
        <div className="text-[10px] font-medium text-gray-500">{label}</div>
        <div className={`text-xs font-bold text-black ${mono ? 'font-mono' : ''}`}>{v}</div>
      </div>
    );
  }

  function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="border border-black rounded p-2">
        <div className="text-[10px] font-bold uppercase border-b border-black pb-1 mb-1.5">{title}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{children}</div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto !bg-white !text-black border-none w-[calc(100%-2rem)] sm:w-full rounded-[15px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Boleta de producción</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mb-4">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#F97316] text-white font-semibold transition-all hover:bg-[#EA580C] hover:scale-105 shadow-md">
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
          <button onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all">
            <X className="w-4 h-4" /> Cerrar
          </button>
        </div>

        {/* ── PREVIEW ── */}
        <div className="bg-white text-black p-4 space-y-3 rounded-lg border border-gray-200">
          <div className="border-b-2 border-black pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-2xl font-bold font-['Bricolage_Grotesque'] text-black">HIDASOL</h1>
              <p className="text-xs font-medium text-black">Orden de Producción</p>
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-lg font-bold text-black">{order.id}</div>
              <div className="text-xs text-gray-600">{formatDate(order.fechaIngreso)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold border border-black rounded px-2 py-0.5">{tipoLabel}</span>
            <span className={`px-3 py-1 rounded font-bold text-xs ${getStatusBg()}`}>{order.estado.toUpperCase()}</span>
          </div>

          <PreviewSection title="Cliente">
            <PreviewField label="Nombre" value={order.cliente} />
            <PreviewField label="WhatsApp" value={order.contactoWhatsApp} mono />
            <PreviewField label="Correo" value={order.correo} mono />
            <PreviewField label="Canal" value={order.canalContacto} />
            <PreviewField label="Solicita" value={order.realizadaPorCliente} />
            <PreviewField label="Encargado por" value={order.encargadoPor} />
            <PreviewField label="Atendido por" value={order.atendidoPor} />
            <PreviewField label="Cód. Cliente" value={order.codigoCliente} mono />
          </PreviewSection>

          <PreviewSection title="Información de la Orden">
            <PreviewField label="Estado" value={order.estado} />
            <PreviewField label="Fecha ingreso" value={formatDate(order.fechaIngreso)} />
            <PreviewField label="Fecha límite" value={order.fechaLimite ? formatDate(order.fechaLimite) : null} />
            <PreviewField label="Producto" value={order.productoNombre} />
            <PreviewField label="Tipo de trabajo" value={order.tipoTrabajo} />
            <PreviewField label="Cantidad" value={order.cantidad} mono />
          </PreviewSection>

          {order.tipoOrden === 'Sellos' && (
            <PreviewSection title="Sello">
              <PreviewField label="Tipo de sello" value={order.tipoSello} />
              <PreviewField label="Modelo" value={order.modeloSello} mono />
              {order.espacioDiseno && (
                <div className="col-span-2 sm:col-span-4">
                  <div className="text-[10px] font-medium text-gray-500">Espacio para Diseño</div>
                  <div className="border border-black rounded p-2 min-h-[60px] text-xs mt-1 whitespace-pre-wrap">{order.espacioDiseno}</div>
                </div>
              )}
            </PreviewSection>
          )}

          {order.tipoOrden === 'Papeleria' && (
            <PreviewSection title="Indicaciones de Impresión">
              <PreviewField label="Trabajo" value={order.trabajo} />
              <PreviewField label="Tipo impresión" value={order.tecnica} />
              <PreviewField label="Color de tinta" value={order.colorTinta === 'Otro' ? `Otro: ${order.colorTintaOtro}` : order.colorTinta} />
              <PreviewField label="Tipo de arte" value={order.tipoArte} />
              <PreviewField label="Muestra" value={order.muestra} />
              <PreviewField label="Factura No" value={order.facturaNo} mono />
            </PreviewSection>
          )}

          {order.tipoOrden === 'Rotulacion' && (
            <>
              {getElementos(order).length > 1 ? (
                getElementos(order).map((el, i) => {
                  const unidad = el.unidadMedida || 'cm';
                  const tieneMedidas = (el.alto || 0) > 0 || (el.ancho || 0) > 0;
                  return (
                    <PreviewSection key={i} title={`Elemento ${i + 1}${el.productoNombre ? ' — ' + el.productoNombre : ''}`}>
                      <PreviewField label="Producto" value={el.productoNombre} />
                      <PreviewField label="Cantidad" value={el.cantidad} mono />
                      <PreviewField label="Descripción" value={el.descripcion} />
                      <PreviewField label="Material" value={el.materialPrincipal ? `${el.materialPrincipal}${el.tipoMaterial ? ' — ' + el.tipoMaterial : ''}` : null} />
                      <PreviewField label="Alto" value={tieneMedidas ? `${el.alto || 0} ${unidad}` : null} mono />
                      <PreviewField label="Ancho" value={tieneMedidas ? `${el.ancho || 0} ${unidad}` : null} mono />
                      <PreviewField label="Color / Impresión" value={el.colorImpresion} />
                      <PreviewField label="Técnica" value={el.tecnica} />
                      <PreviewField label="Caras" value={el.caras} />
                      {el.acabados && el.acabados.length > 0 && (
                        <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-1">
                          {el.acabados.map(a => <span key={a} className="px-2 py-0.5 border border-black rounded-full text-[10px] font-medium">{a}</span>)}
                        </div>
                      )}
                    </PreviewSection>
                  );
                })
              ) : (
                <PreviewSection title="Material y Medidas">
                  <PreviewField label="Material" value={`${order.materialPrincipal} — ${order.tipoMaterial}`} />
                  <PreviewField label="Alto" value={`${order.alto} ${order.unidadMedida || 'cm'}`} mono />
                  <PreviewField label="Ancho" value={`${order.ancho} ${order.unidadMedida || 'cm'}`} mono />
                  <PreviewField label="Color / Impresión" value={order.colorImpresion} />
                  <PreviewField label="Técnica" value={order.tecnica} />
                  <PreviewField label="Caras" value={order.caras} />
                </PreviewSection>
              )}
              {getElementos(order).length <= 1 && order.acabados && order.acabados.length > 0 && (
                <div className="border border-black rounded p-2">
                  <div className="text-[10px] font-bold uppercase border-b border-black pb-1 mb-1.5">Acabados</div>
                  <div className="flex flex-wrap gap-1">
                    {order.acabados.map(a => <span key={a} className="px-2 py-0.5 border border-black rounded-full text-[10px] font-medium">{a}</span>)}
                  </div>
                </div>
              )}
              {(order.corporeoMulti?.length || order.corporeoTipo) && (
                <PreviewSection title="Corpóreos">
                  {order.corporeoMulti && <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-1">{order.corporeoMulti.map(c => <span key={c} className="px-2 py-0.5 border border-black rounded-full text-[10px] font-medium">{c}</span>)}</div>}
                  <PreviewField label="Color corpóreo" value={order.corporeoColor} />
                  <PreviewField label="Fuente" value={order.corporeoFuente} />
                  <PreviewField label="Material" value={order.corporeoMaterial} />
                  <PreviewField label="Grosor" value={order.corporeoGrosor ? `${order.corporeoGrosor} mm` : null} />
                  <PreviewField label="Estructura" value={order.corporeoEstructura} />
                  <PreviewField label="Color manguera" value={order.colorManguera} />
                </PreviewSection>
              )}
            </>
          )}

          <PreviewSection title="Diseño">
            <PreviewField label="Diseño listo" value={order.disenoListo ? 'Sí' : 'No'} />
            <PreviewField label="Tipo diseño" value={order.tipoDiseno || order.tipoArte} />
            <PreviewField label="Diseñado por" value={order.disenadoPor} />
            <PreviewField label="Envío arte" value={order.fechaEnvioArte ? formatDate(order.fechaEnvioArte) : null} />
            <PreviewField label="Aprobación" value={order.fechaAprobacion ? formatDate(order.fechaAprobacion) : null} />
          </PreviewSection>

          <PreviewSection title="Producción">
            <PreviewField label="Máquina" value={Array.isArray(order.maquinaAsignada) ? order.maquinaAsignada.join(', ') : order.maquinaAsignada} />
            <PreviewField label="Impreso por" value={order.impresoPor} />
            <PreviewField label="Realizado por" value={order.realizadaPor} />
            <PreviewField label="Finalizado por" value={order.finalizadoPor} />
            {order.tipoOrden === 'Papeleria' && <>
              <PreviewField label="Numerado por" value={order.numeradoPor} />
              <PreviewField label="Empacado por" value={order.empacadoPor} />
              <PreviewField label="Coleccionado por" value={order.coleccionadoPor} />
              <PreviewField label="Refilado por" value={order.refiladoPor} />
            </>}
            <PreviewField label="Mts impresos" value={order.metrosImpresos != null ? `${order.metrosImpresos} m` : null} mono />
            <PreviewField label="Mts desperdicio" value={order.metrosDesperdicio != null ? `${order.metrosDesperdicio} m` : null} mono />
            <PreviewField label="ML tinta" value={order.mlUsoTinta != null ? `${order.mlUsoTinta} ml` : null} mono />
          </PreviewSection>

          <div className="border-2 border-black rounded p-2">
            <div className="text-[10px] font-bold uppercase border-b border-black pb-1 mb-1.5">Valores</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="font-medium">Valor Total:</span><span className="font-mono font-bold">{formatCurrency(order.valorTotal)}</span></div>
              {order.incluirIVA && <div className="flex justify-between"><span className="font-medium">IVA (13%):</span><span className="font-mono font-bold">{formatCurrency(montoConIVA - order.valorTotal)}</span></div>}
              {order.incluirIVA && <div className="flex justify-between"><span className="font-medium">Total con IVA:</span><span className="font-mono font-bold">{formatCurrency(montoConIVA)}</span></div>}
              <div className="flex justify-between"><span className="font-medium">Abono:</span><span className="font-mono font-bold">{formatCurrency(order.abono)}</span></div>
              <div className="flex justify-between pt-1 border-t border-black"><span className="font-bold text-sm">SALDO:</span><span className="font-mono font-bold text-sm">{formatCurrency(saldo)}</span></div>
              <div className="flex justify-between mt-1 pt-1 border-t border-gray-300 text-gray-600">
                <span>Forma de pago:</span><span className="font-medium">{order.formaPago}</span>
              </div>
              {order.descuentoAplicado && <div className="flex justify-between text-gray-600"><span>Descuento:</span><span className="font-mono">{formatCurrency(order.descuentoMonto || 0)}</span></div>}
            </div>
          </div>

          {(order.especificaciones || order.notasAdicionales) && (
            <div className="border border-black rounded p-2">
              <div className="text-[10px] font-bold uppercase border-b border-black pb-1 mb-1.5">Notas / Especificaciones</div>
              {order.especificaciones && <div className="text-xs mb-1 whitespace-pre-wrap">{order.especificaciones}</div>}
              {order.notasAdicionales && <div className="text-xs text-gray-600 whitespace-pre-wrap">{order.notasAdicionales}</div>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="border-t border-black pt-1 text-center text-xs font-medium">Operario / Diseñador</div>
            <div className="border-t border-black pt-1 text-center text-xs font-medium">Supervisor</div>
          </div>

          <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-gray-200">
            <div className="font-mono font-bold text-black">{order.id}</div>
          </div>
        </div>

        {/* Hidden print target */}
        <div ref={printRef} className="hidden" dangerouslySetInnerHTML={{ __html: printBody }} />
      </DialogContent>
    </Dialog>
  );
}
