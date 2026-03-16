import { Order, calcularSaldo, calcularMontoConIVA } from '@/types/order';
import { formatCurrency, formatDate } from '@/lib/order-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface ProductionTicketProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductionTicket({ order, isOpen, onClose }: ProductionTicketProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const safeOrderId = order?.id ?? '';

  const handlePrint = useCallback(() => {
    if (!order) return;
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Boleta - ${safeOrderId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Newsreader', serif; font-size: 12px; line-height: 1.4; color: #000; background: #fff; padding: 16px; }
    h1, h2, h3 { font-family: 'Bricolage Grotesque', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .ticket-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px; }
    .ticket-header h1 { font-size: 22px; font-weight: 700; }
    .ticket-header .subtitle { font-size: 12px; font-weight: 500; }
    .order-id { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; }
    .order-date { font-size: 10px; }
    .status-badge { display: inline-block; padding: 4px 16px; border-radius: 6px; font-weight: 700; font-size: 12px; text-align: center; }
    .status-nueva { background: #60A5FA; color: #1E3A8A; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .status-proceso { background: #F97316; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .status-terminado { background: #34D399; color: #065F46; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section { border: 1px solid #000; border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .section-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 11px; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; text-transform: uppercase; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
    .field-label { font-size: 10px; font-weight: 500; color: #555; }
    .field-value { font-size: 11px; font-weight: 700; }
    .field-value-mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; }
    .pill { display: inline-block; padding: 2px 8px; border: 1px solid #000; border-radius: 999px; font-size: 9px; font-weight: 500; margin: 2px; }
    .valores-section { border: 2px solid #000; border-radius: 6px; padding: 8px; margin-bottom: 8px; background: #f9f9f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .valor-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .valor-row.total { border-top: 1px solid #000; padding-top: 4px; margin-top: 2px; }
    .firmas-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-top: 12px; }
    .firma-line { border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; font-weight: 500; }
    .footer { text-align: center; font-size: 9px; color: #666; border-top: 1px solid #000; padding-top: 6px; margin-top: 8px; }
    .footer .mono { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 10px; color: #000; }
    .text-center { text-align: center; }
    @media print { body { padding: 0; } @page { margin: 0.5cm; size: letter portrait; } }
  </style>
</head>
<body>${printContent}</body>
</html>`);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 600);
  }, [order, safeOrderId]);

  if (!order) return null;

  const saldo = calcularSaldo(order);
  const montoConIVA = calcularMontoConIVA(order);

  const statusClass = order.estado === 'Nueva' 
    ? 'status-nueva' 
    : order.estado === 'En proceso' 
    ? 'status-proceso' 
    : 'status-terminado';

  const getStatusBgForPreview = () => {
    switch (order.estado) {
      case 'Nueva': return 'bg-[#60A5FA] text-[#1E3A8A]';
      case 'En proceso': return 'bg-[#F97316] text-white';
      case 'Terminado': return 'bg-[#34D399] text-[#065F46]';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto !bg-white !text-black border-none w-[calc(100%-2rem)] sm:w-full rounded-[15px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Boleta de producción</DialogTitle>
        </DialogHeader>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mb-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#F97316] text-white font-semibold transition-all duration-200 hover:bg-[#EA580C] hover:scale-105 shadow-md"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200"
          >
            <X className="w-4 h-4" />
            Cerrar
          </button>
        </div>

        {/* ===== VISIBLE PREVIEW (always white) ===== */}
        <div className="bg-white text-black p-4 space-y-3 rounded-lg border border-gray-200">
          {/* Header */}
          <div className="border-b-2 border-black pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-['Bricolage_Grotesque'] text-black">HIDASOL</h1>
                <p className="text-sm font-medium text-black">Orden de Producción</p>
              </div>
              <div className="sm:text-right">
                <div className="font-mono text-base sm:text-lg font-bold text-black">{order.id}</div>
                <div className="text-xs text-gray-700">{formatDate(order.fechaIngreso)}</div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <div className={`inline-block px-4 py-1.5 rounded-md font-bold text-sm ${getStatusBgForPreview()}`}>
              {order.estado.toUpperCase()}
            </div>
          </div>

          {/* Cliente */}
          <div className="border border-black rounded-md p-2">
            <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1.5 border-b border-black pb-1 text-black">CLIENTE</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><div className="font-medium text-gray-600">Nombre</div><div className="font-bold text-black">{order.cliente}</div></div>
              <div><div className="font-medium text-gray-600">WhatsApp</div><div className="font-mono font-bold text-black">{order.contactoWhatsApp}</div></div>
              <div><div className="font-medium text-gray-600">Correo</div><div className="font-mono text-[10px] text-black break-all">{order.correo}</div></div>
              <div><div className="font-medium text-gray-600">Canal</div><div className="text-black">{order.canalContacto}</div></div>
            </div>
          </div>

          {/* Producto */}
          <div className="border border-black rounded-md p-2">
            <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1.5 border-b border-black pb-1 text-black">PRODUCTO</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><div className="font-medium text-gray-600">Nombre</div><div className="font-bold text-black">{order.productoNombre}</div></div>
              <div><div className="font-medium text-gray-600">Cantidad</div><div className="font-mono font-bold text-black">{order.cantidad}</div></div>
              <div><div className="font-medium text-gray-600">Material</div><div className="font-medium text-black">{order.materialPrincipal} — {order.tipoMaterial}</div></div>
              <div><div className="font-medium text-gray-600">Tipo</div><div className="text-black">{order.tipoTrabajo}</div></div>
            </div>
          </div>

          {/* Medidas + Impresión */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="border border-black rounded-md p-2">
              <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1 border-b border-black pb-1 text-black">MEDIDAS (cm)</h2>
              <div className="flex gap-3 text-xs">
                <div><span className="font-medium text-gray-600">Alto: </span><span className="font-mono font-bold text-black">{order.alto}</span></div>
                <div><span className="font-medium text-gray-600">Ancho: </span><span className="font-mono font-bold text-black">{order.ancho}</span></div>
              </div>
            </div>
            <div className="border border-black rounded-md p-2">
              <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1 border-b border-black pb-1 text-black">IMPRESIÓN</h2>
              <div className="flex gap-2 text-xs">
                <div><span className="text-gray-600">Color: </span><span className="font-medium text-black">{order.colorImpresion}</span></div>
                <div><span className="text-gray-600">Técnica: </span><span className="font-medium text-black">{order.tecnica}</span></div>
                <div><span className="text-gray-600">Caras: </span><span className="font-medium text-black">{order.caras}</span></div>
              </div>
            </div>
          </div>

          {/* Acabados + Máquina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.acabados && order.acabados.length > 0 && (
              <div className="border border-black rounded-md p-2">
                <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1 border-b border-black pb-1 text-black">ACABADOS</h2>
                <div className="flex flex-wrap gap-1">
                  {order.acabados.map(a => (
                    <span key={a} className="px-2 py-0.5 border border-black rounded-full text-[10px] font-medium text-black">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {order.maquinaAsignada && (
              <div className="border border-black rounded-md p-2">
                <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1 border-b border-black pb-1 text-black">MÁQUINA</h2>
                <div className="text-sm font-bold text-black">{Array.isArray(order.maquinaAsignada) ? order.maquinaAsignada.join(', ') : order.maquinaAsignada}</div>
              </div>
            )}
          </div>

          {/* Notas */}
          {(order.especificaciones || order.notasAdicionales) && (
            <div className="border border-black rounded-md p-2">
              <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1 border-b border-black pb-1 text-black">NOTAS</h2>
              {order.especificaciones && <div className="text-xs mb-1 text-black">{order.especificaciones}</div>}
              {order.notasAdicionales && <div className="text-xs text-gray-600">{order.notasAdicionales}</div>}
            </div>
          )}

          {/* Valores */}
          <div className="border-2 border-black rounded-md p-2 bg-gray-50">
            <h2 className="text-sm font-bold font-['Bricolage_Grotesque'] mb-1 border-b border-black pb-1 text-black">VALORES</h2>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="font-medium text-black">Valor Total:</span><span className="font-mono font-bold text-black">{formatCurrency(order.valorTotal)}</span></div>
              <div className="flex justify-between"><span className="font-medium text-black">Abono:</span><span className="font-mono font-bold text-black">{formatCurrency(order.abono)}</span></div>
              <div className="flex justify-between pt-1 border-t border-black"><span className="font-bold text-black">SALDO:</span><span className="text-sm font-mono font-bold text-black">{formatCurrency(saldo)}</span></div>
              {order.incluirIVA && (
                <div className="flex justify-between"><span className="font-medium text-black">Con IVA (13%):</span><span className="font-mono font-bold text-black">{formatCurrency(montoConIVA)}</span></div>
              )}
            </div>
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-4 pt-3">
            <div className="border-t border-black pt-1"><div className="text-center text-xs font-medium text-black">Operario</div></div>
            <div className="border-t border-black pt-1"><div className="text-center text-xs font-medium text-black">Supervisor</div></div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-black">
            <div className="font-mono font-bold text-black">{order.id}</div>
          </div>
        </div>

        {/* ===== HIDDEN PRINT HTML (rendered into new window) ===== */}
        <div ref={printRef} className="hidden">
          <div className="ticket-header">
            <div>
              <h1>HIDASOL</h1>
              <div className="subtitle">Orden de Producción</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="order-id">{order.id}</div>
              <div className="order-date">{formatDate(order.fechaIngreso)}</div>
            </div>
          </div>

          <div className="text-center" style={{ marginBottom: '8px' }}>
            <span className={`status-badge ${statusClass}`}>{order.estado.toUpperCase()}</span>
          </div>

          <div className="section">
            <div className="section-title">Cliente</div>
            <div className="grid-4">
              <div><div className="field-label">Nombre</div><div className="field-value">{order.cliente}</div></div>
              <div><div className="field-label">WhatsApp</div><div className="field-value-mono">{order.contactoWhatsApp}</div></div>
              <div><div className="field-label">Correo</div><div className="field-value-mono" style={{ fontSize: '9px' }}>{order.correo}</div></div>
              <div><div className="field-label">Canal</div><div className="field-value">{order.canalContacto}</div></div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Producto</div>
            <div className="grid-4">
              <div><div className="field-label">Nombre</div><div className="field-value">{order.productoNombre}</div></div>
              <div><div className="field-label">Cantidad</div><div className="field-value-mono">{order.cantidad}</div></div>
              <div><div className="field-label">Material</div><div className="field-value">{order.materialPrincipal} — {order.tipoMaterial}</div></div>
              <div><div className="field-label">Tipo</div><div className="field-value">{order.tipoTrabajo}</div></div>
            </div>
          </div>

          <div className="grid-2">
            <div className="section">
              <div className="section-title">Medidas (cm)</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div><span className="field-label">Alto: </span><span className="field-value-mono">{order.alto}</span></div>
                <div><span className="field-label">Ancho: </span><span className="field-value-mono">{order.ancho}</span></div>
              </div>
            </div>
            <div className="section">
              <div className="section-title">Impresión</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div><span className="field-label">Color: </span><span className="field-value">{order.colorImpresion}</span></div>
                <div><span className="field-label">Técnica: </span><span className="field-value">{order.tecnica}</span></div>
                <div><span className="field-label">Caras: </span><span className="field-value">{order.caras}</span></div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {order.acabados && order.acabados.length > 0 && (
              <div className="section">
                <div className="section-title">Acabados</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {order.acabados.map(a => (<span key={a} className="pill">{a}</span>))}
                </div>
              </div>
            )}
            {order.maquinaAsignada && (
              <div className="section">
                <div className="section-title">Máquina</div>
                <div className="field-value" style={{ fontSize: '13px' }}>{Array.isArray(order.maquinaAsignada) ? order.maquinaAsignada.join(', ') : order.maquinaAsignada}</div>
              </div>
            )}
          </div>

          {(order.especificaciones || order.notasAdicionales) && (
            <div className="section">
              <div className="section-title">Notas</div>
              {order.especificaciones && <div style={{ fontSize: '11px', marginBottom: '4px' }}>{order.especificaciones}</div>}
              {order.notasAdicionales && <div style={{ fontSize: '11px', color: '#555' }}>{order.notasAdicionales}</div>}
            </div>
          )}

          <div className="valores-section">
            <div className="section-title">Valores</div>
            <div className="valor-row"><span className="field-value">Valor Total:</span><span className="field-value-mono">{formatCurrency(order.valorTotal)}</span></div>
            <div className="valor-row"><span className="field-value">Abono:</span><span className="field-value-mono">{formatCurrency(order.abono)}</span></div>
            <div className="valor-row total"><span className="field-value" style={{ fontWeight: 800 }}>SALDO:</span><span className="field-value-mono" style={{ fontSize: '13px' }}>{formatCurrency(saldo)}</span></div>
            {order.incluirIVA && (
              <div className="valor-row"><span className="field-value">Con IVA (13%):</span><span className="field-value-mono">{formatCurrency(montoConIVA)}</span></div>
            )}
          </div>

          <div className="firmas-row">
            <div className="firma-line">Operario</div>
            <div className="firma-line">Supervisor</div>
          </div>

          <div className="footer">
            <div className="mono">{order.id}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
