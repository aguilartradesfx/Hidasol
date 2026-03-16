import { Order, OrderStatus, calcularSaldo, calcularMontoConIVA } from '@/types/order';
import { formatCurrency, formatDate } from '@/lib/order-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Printer, Edit, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const DISENO_OPTIONS = ['Arte 1', 'Arte 2', 'Arte 3', 'Arte 4'];

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  onEdit: (order: Order) => void;
  onPrint: (order: Order) => void;
  onDisenadoPorChange?: (orderId: string, value: string) => void;
  isAdmin?: boolean;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onEdit,
  onPrint,
  onDisenadoPorChange,
  isAdmin = false,
}: OrderDetailModalProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [disenoOpen, setDisenoOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const disenoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (disenoRef.current && !disenoRef.current.contains(e.target as Node)) setDisenoOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!order) return null;

  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'Nueva':
        return 'bg-[#FCD34D] text-[#92400E]';
      case 'En proceso':
        return 'bg-[#60A5FA] text-[#1E3A8A]';
      case 'Terminado':
        return 'bg-[#34D399] text-[#065F46]';
    }
  };

  const statuses: OrderStatus[] = ['Nueva', 'En proceso', 'Terminado'];
  const saldo = calcularSaldo(order);
  const montoConIVA = calcularMontoConIVA(order);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border w-[calc(100%-2rem)] sm:w-full rounded-[15px]">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-2xl lg:text-3xl font-bold font-['Bricolage_Grotesque']">
                Orden <span className="text-[#F97316]">{order.id}</span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(order.fechaIngreso)}
              </p>
            </div>

            {/* Status Dropdown */}
            <div ref={statusRef} className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95 shadow-md ${getStatusStyles(order.estado)}`}
              >
                {order.estado}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${statusOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-[10px] shadow-xl z-50 overflow-hidden">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        onStatusChange(order.id, s);
                        setStatusOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-all duration-150 hover:bg-accent ${order.estado === s ? 'opacity-50 cursor-default' : ''}`}
                    >
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${s === 'Nueva' ? 'bg-[#FCD34D]' : s === 'En proceso' ? 'bg-[#60A5FA]' : 'bg-[#34D399]'}`} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(order)}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-secondary text-secondary-foreground font-medium transition-smooth hover:scale-105"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => onPrint(order)}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-primary-foreground font-medium transition-smooth hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              Emitir Boleta
            </button>
          </div>

          <Accordion type="multiple" defaultValue={['cliente', 'producto', 'material', 'medidas', 'valores']} className="space-y-3">
            {/* Cliente */}
            <AccordionItem value="cliente" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Cliente
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-base font-medium">{order.cliente}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                    <p className="text-base font-medium font-mono">{order.contactoWhatsApp}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Correo</label>
                    <p className="text-base font-medium font-mono break-all">{order.correo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Canal</label>
                    <p className="text-base font-medium">{order.canalContacto}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Producto */}
            <AccordionItem value="producto" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Producto
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                    <p className="text-base font-medium">{order.productoNombre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID</label>
                    <p className="text-base font-medium font-mono">{order.productoId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo de trabajo</label>
                    <p className="text-base">{order.tipoTrabajo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cantidad</label>
                    <p className="text-base font-medium font-mono">{order.cantidad}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Material */}
            <AccordionItem value="material" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Material
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Material principal</label>
                    <p className="text-base font-medium">{order.materialPrincipal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p className="text-base font-medium">{order.tipoMaterial}</p>
                  </div>
                  {order.grosorMaterial && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Grosor</label>
                      <p className="text-base font-medium font-mono">{order.grosorMaterial}mm</p>
                    </div>
                  )}
                  {order.colorMaterial && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Color material</label>
                      <p className="text-base">{order.colorMaterial}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Medidas */}
            <AccordionItem value="medidas" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Medidas
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Alto (cm)</label>
                    <p className="text-base font-medium font-mono">{order.alto}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ancho (cm)</label>
                    <p className="text-base font-medium font-mono">{order.ancho}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Impresión */}
            {(order.colorImpresion || order.tecnica || order.caras) && (
              <AccordionItem value="impresion" className="border border-border rounded-[10px] px-4">
                <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                  Impresión
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Color/Impresión</label>
                      <p className="text-base font-medium">{order.colorImpresion}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Técnica</label>
                      <p className="text-base font-medium">{order.tecnica}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Caras</label>
                      <p className="text-base font-medium">{order.caras}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Acabados */}
            {order.acabados && order.acabados.length > 0 && (
              <AccordionItem value="acabados" className="border border-border rounded-[10px] px-4">
                <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                  Acabados
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {order.acabados.map(a => (
                      <span key={a} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Corpóreos */}
            {order.corporeoTipo && (
              <AccordionItem value="corporeos" className="border border-border rounded-[10px] px-4">
                <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                  Corpóreos
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p className="text-base font-medium">{order.corporeoTipo}</p>
                    </div>
                    {order.corporeoColor && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Color</label>
                        <p className="text-base font-medium">{order.corporeoColor}</p>
                      </div>
                    )}
                    {order.corporeoFuente && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fuente</label>
                        <p className="text-base font-medium">{order.corporeoFuente}</p>
                      </div>
                    )}
                    {order.corporeoMaterial && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Material</label>
                        <p className="text-base font-medium">{order.corporeoMaterial}</p>
                      </div>
                    )}
                    {order.corporeoGrosor && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Grosor</label>
                        <p className="text-base font-medium font-mono">{order.corporeoGrosor}mm</p>
                      </div>
                    )}
                    {order.corporeoEstructura && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Estructura</label>
                        <p className="text-base font-medium">{order.corporeoEstructura}</p>
                      </div>
                    )}
                    {order.colorManguera && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Color de Manguera</label>
                        <p className="text-base font-medium">{order.colorManguera}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Instalación */}
            <AccordionItem value="instalacion" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Instalación
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Requiere</label>
                    <p className="text-base font-medium">{order.requiereInstalacion ? 'Sí' : 'No'}</p>
                  </div>
                  {order.lugarInstalacion && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lugar</label>
                      <p className="text-base">{order.lugarInstalacion}</p>
                    </div>
                  )}
                  {order.fechaEntrega && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha entrega</label>
                      <p className="text-base font-mono">{formatDate(order.fechaEntrega)}</p>
                    </div>
                  )}
                  {order.fechaLimite && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Deadline / Fecha límite</label>
                      <p className="text-base font-mono">{formatDate(order.fechaLimite)}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Diseño */}
            <AccordionItem value="diseno" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Diseño
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Diseño listo</label>
                    <p className="text-base font-medium">{order.disenoListo ? 'Sí' : 'No'}</p>
                  </div>
                  {order.tipoDiseno && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo de diseño</label>
                      <p className="text-base font-medium">{order.tipoDiseno}</p>
                    </div>
                  )}
                  {/* Diseñado por */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Diseñado por</label>
                    {isAdmin ? (
                      <div ref={disenoRef} className="relative">
                        <button
                          onClick={() => setDisenoOpen(!disenoOpen)}
                          className="flex items-center justify-between gap-2 w-full max-w-[180px] px-3 py-2 bg-secondary border border-border rounded-[8px] text-sm font-medium transition-all duration-200 hover:border-primary/50"
                        >
                          <span>{order.disenadoPor ?? 'Sin asignar'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${disenoOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {disenoOpen && (
                          <div className="absolute left-0 top-full mt-1.5 w-[180px] bg-card border border-border rounded-[10px] shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={() => {
                                onDisenadoPorChange?.(order.id, '');
                                setDisenoOpen(false);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent transition-all duration-150"
                            >
                              Sin asignar
                            </button>
                            {DISENO_OPTIONS.map(opt => (
                              <button
                                key={opt}
                                onClick={() => {
                                  onDisenadoPorChange?.(order.id, opt);
                                  setDisenoOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-accent transition-all duration-150 ${order.disenadoPor === opt ? 'text-primary font-semibold' : ''}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-base font-medium">{order.disenadoPor ?? '—'}</p>
                    )}
                  </div>
                  {order.fechaEnvioArte && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Envío de arte</label>
                      <p className="text-base font-mono">{formatDate(order.fechaEnvioArte)}</p>
                    </div>
                  )}
                  {order.fechaAprobacion && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Aprobación</label>
                      <p className="text-base font-mono">{formatDate(order.fechaAprobacion)}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Valores */}
            <AccordionItem value="valores" className="border border-border rounded-[10px] px-4">
              <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                Facturación
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Forma de pago</label>
                    <p className="text-base font-medium">{order.formaPago}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Factura electrónica</label>
                    <p className="text-base font-medium">{order.facturaElectronica ? 'Sí' : 'No'}</p>
                  </div>
                  {order.facturaElectronica && order.facturarANombreDe && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Facturar a nombre de</label>
                      <p className="text-base font-medium">{order.facturarANombreDe}</p>
                    </div>
                  )}
                  {order.facturaElectronica && order.cedulaJuridica && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cédula jurídica</label>
                      <p className="text-base font-medium font-mono">{order.cedulaJuridica}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                    <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(order.valorTotal)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Abono</label>
                    <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(order.abono)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Saldo</label>
                    <p className="text-xl font-bold font-mono text-primary">{formatCurrency(saldo)}</p>
                  </div>
                  {order.incluirIVA && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Monto con IVA (13%)</label>
                      <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(montoConIVA)}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Notas */}
            {(order.especificaciones || order.notasAdicionales) && (
              <AccordionItem value="notas" className="border border-border rounded-[10px] px-4">
                <AccordionTrigger className="text-lg font-semibold font-['Bricolage_Grotesque'] hover:no-underline">
                  Notas
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  {order.especificaciones && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Especificaciones</label>
                      <p className="text-base">{order.especificaciones}</p>
                    </div>
                  )}
                  {order.notasAdicionales && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notas adicionales</label>
                      <p className="text-base">{order.notasAdicionales}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
