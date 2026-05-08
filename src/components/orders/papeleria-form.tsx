'use client';

import { useState, useEffect } from 'react';
import { Order, ColorTintaPapeleria, TipoArtePapeleria, FormaPago } from '@/types/order';
import { formatCurrency } from '@/lib/order-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';

interface PapeleriaFormProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => Promise<{ error: string | null }>;
}

const COLORES_TINTA: ColorTintaPapeleria[] = ['Negro', 'Azul', 'Otro'];
const TIPOS_ARTE: TipoArtePapeleria[] = ['Solo Impresión', 'Hacer Arte Nuevo', 'Modificar Arte Existente'];
const FORMAS_PAGO: FormaPago[] = ['Efectivo', 'Tarjeta', 'Transferencia'];
const DISENO_OPTIONS = ['Arte 1', 'Arte 2', 'Arte 3', 'Arte 4'];

function emptyPapeleria(): Partial<Order> {
  return {
    tipoOrden: 'Papeleria',
    cliente: '',
    contactoWhatsApp: '',
    correo: '',
    estado: 'Nueva',
    fechaIngreso: new Date(),
    cantidad: 1,
    valorTotal: 0,
    abono: 0,
    incluirIVA: false,
    formaPago: 'Efectivo',
    descuentoAplicado: false,
    descuentoMonto: 0,
    muestra: false,
    productoNombre: '',
    productoId: '',
    tipoTrabajo: 'Papelería',
    materialPrincipal: 'Otros',
    tipoMaterial: '',
    alto: 0,
    ancho: 0,
    colorImpresion: '',
    tecnica: '',
    caras: '',
    acabados: [],
    requiereInstalacion: false,
    disenoListo: false,
    facturaElectronica: false,
    canalContacto: 'WhatsApp',
  };
}

function ChipButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-[8px] text-sm font-medium border transition-all duration-150 ${
        active
          ? 'bg-[#34D399]/20 border-[#34D399] text-[#34D399]'
          : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
      }`}>
      {label}
    </button>
  );
}

export function PapeleriaForm({ order, isOpen, onClose, onSave }: PapeleriaFormProps) {
  const [form, setForm] = useState<Partial<Order>>(emptyPapeleria());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setForm({ ...order });
    } else {
      setForm(emptyPapeleria());
    }
    setSaveError(null);
  }, [order, isOpen]);

  const isEditMode = !!order;
  const set = (field: keyof Order, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const ivaAmount = form.incluirIVA ? (form.valorTotal || 0) * 0.13 : 0;
  const saldo = (form.valorTotal || 0) - (form.abono || 0);

  const formatDateForInput = (d: Date | string | undefined) => {
    if (!d) return '';
    return new Date(d).toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const orderToSave: Order = {
      id: order?.id || 'TEMP',
      tipoOrden: 'Papeleria',
      cliente: form.cliente || '',
      contactoWhatsApp: form.contactoWhatsApp || '',
      correo: form.correo || '',
      canalContacto: 'WhatsApp',
      estado: 'Nueva',
      fechaIngreso: isEditMode ? (form.fechaIngreso || new Date()) : new Date(),
      productoNombre: form.trabajo || form.productoNombre || 'Papelería',
      productoId: form.productoId || '',
      tipoTrabajo: 'Papelería',
      cantidad: form.cantidad || 1,
      unidadMedida: 'cm',
      materialPrincipal: 'Otros',
      tipoMaterial: '',
      alto: 0,
      ancho: 0,
      colorImpresion: '',
      tecnica: form.tecnica || '',
      caras: '',
      acabados: [],
      requiereInstalacion: false,
      disenoListo: false,
      formaPago: form.formaPago || 'Efectivo',
      facturaElectronica: form.facturaElectronica || false,
      facturarANombreDe: form.facturarANombreDe,
      valorTotal: form.valorTotal || 0,
      abono: form.abono || 0,
      incluirIVA: form.incluirIVA || false,
      // Papelería fields
      trabajo: form.trabajo,
      facturaNo: form.facturaNo,
      facturadoEl: form.facturadoEl,
      realizadaPorCliente: form.realizadaPorCliente,
      hechaPor: form.hechaPor,
      atendidoPor: form.atendidoPor,
      codigoCliente: form.codigoCliente,
      muestra: form.muestra || false,
      colorTinta: form.colorTinta,
      colorTintaOtro: form.colorTintaOtro,
      tipoArte: form.tipoArte,
      descuentoAplicado: form.descuentoAplicado || false,
      descuentoMonto: form.descuentoMonto || 0,
      disenadoPor: form.disenadoPor,
      impresoPor: form.impresoPor,
      numeradoPor: form.numeradoPor,
      empacadoPor: form.empacadoPor,
      coleccionadoPor: form.coleccionadoPor,
      refiladoPor: form.refiladoPor,
      notasAdicionales: form.notasAdicionales,
      especificaciones: form.especificaciones,
    };

    try {
      const result = await onSave(orderToSave);
      if (result.error) setSaveError(result.error);
    } catch (err: any) {
      setSaveError(err?.message || 'Error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-background border-border w-[calc(100vw-1.5rem)] sm:w-full rounded-[15px]">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold font-['Bricolage_Grotesque']">
            {isEditMode ? 'Editar Orden' : 'Nueva Orden'}{' '}
            <span className="text-[#34D399]">— Papelería</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">

          {/* Cliente */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Cliente *</Label>
                <Input required value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Nombre o razón social" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.contactoWhatsApp || ''} onChange={e => set('contactoWhatsApp', e.target.value)} className="mt-1 rounded-[10px]" placeholder="+506 8888-8888" type="tel" />
              </div>
              <div>
                <Label>Trabajo / Descripción</Label>
                <Input value={form.trabajo || ''} onChange={e => set('trabajo', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Ej: Tarjetas de presentación" />
              </div>
              <div>
                <Label>Cantidad *</Label>
                <Input required type="number" min="1" value={form.cantidad || 1} onChange={e => set('cantidad', parseInt(e.target.value) || 1)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Solicita (persona en el cliente)</Label>
                <Input value={form.realizadaPorCliente || ''} onChange={e => set('realizadaPorCliente', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Nombre de quien solicita" />
              </div>
              <div>
                <Label>Atendido por</Label>
                <Input value={form.atendidoPor || ''} onChange={e => set('atendidoPor', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Vendedor que atendió" />
              </div>
              <div>
                <Label>Hecha por</Label>
                <Input value={form.hechaPor || ''} onChange={e => set('hechaPor', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Quien procesa la orden" />
              </div>
              <div>
                <Label>Código Cliente</Label>
                <Input value={form.codigoCliente || ''} onChange={e => set('codigoCliente', e.target.value)} className="mt-1 rounded-[10px] font-mono" placeholder="CL-001" />
              </div>
            </div>
          </section>

          {/* Facturación */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Facturación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Factura No</Label>
                <Input value={form.facturaNo || ''} onChange={e => set('facturaNo', e.target.value)} className="mt-1 rounded-[10px] font-mono" placeholder="FAC-0001" />
              </div>
              <div>
                <Label>Facturar a nombre de</Label>
                <Input value={form.facturarANombreDe || ''} onChange={e => set('facturarANombreDe', e.target.value)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Facturado el</Label>
                <Input type="date" value={formatDateForInput(form.facturadoEl)} onChange={e => set('facturadoEl', e.target.value ? new Date(e.target.value) : undefined)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Correo (para envío de muestra)</Label>
                <Input type="email" value={form.correo || ''} onChange={e => set('correo', e.target.value)} className="mt-1 rounded-[10px]" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.muestra || false} onCheckedChange={v => set('muestra', v)} />
              <Label>¿Se envía muestra?</Label>
            </div>
          </section>

          {/* Indicaciones */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-4">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Indicaciones de Impresión</h3>

            <div>
              <Label>Tipo de Impresión</Label>
              <Input value={form.tecnica || ''} onChange={e => set('tecnica', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Ej: Digital, Offset..." />
            </div>

            <div>
              <Label className="mb-2 block">Color de Tinta</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORES_TINTA.map(c => (
                  <ChipButton key={c} label={c} active={form.colorTinta === c} onClick={() => set('colorTinta', c)} />
                ))}
              </div>
              {form.colorTinta === 'Otro' && (
                <Input value={form.colorTintaOtro || ''} onChange={e => set('colorTintaOtro', e.target.value)} className="mt-2 rounded-[10px]" placeholder="Especifique el color..." />
              )}
            </div>

            <div>
              <Label className="mb-2 block">Tipo de Arte</Label>
              <div className="flex gap-2 flex-wrap">
                {TIPOS_ARTE.map(t => (
                  <ChipButton key={t} label={t} active={form.tipoArte === t} onClick={() => set('tipoArte', t)} />
                ))}
              </div>
            </div>
          </section>

          {/* Valores */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Valores</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor ¢</Label>
                <Input type="number" min="0" value={form.valorTotal || ''} onChange={e => set('valorTotal', parseFloat(e.target.value) || 0)} className="mt-1 rounded-[10px] font-mono" placeholder="0" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Switch checked={form.incluirIVA || false} onCheckedChange={v => set('incluirIVA', v)} />
                  <Label>IVA (13%)</Label>
                </div>
                <div className="p-2 rounded-[8px] bg-muted/50 border border-border font-mono text-sm font-bold">
                  {formatCurrency(ivaAmount)}
                </div>
              </div>
              <div>
                <Label>Abono ¢</Label>
                <Input type="number" min="0" value={form.abono || ''} onChange={e => set('abono', parseFloat(e.target.value) || 0)} className="mt-1 rounded-[10px] font-mono" placeholder="0" />
              </div>
              <div>
                <Label>Saldo ¢ (calculado)</Label>
                <div className="mt-1 p-2 rounded-[8px] bg-muted/50 border border-border font-mono text-sm font-bold text-primary">
                  {formatCurrency(saldo)}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Forma de Pago</Label>
              <div className="flex gap-2 flex-wrap">
                {FORMAS_PAGO.map(fp => (
                  <button key={fp} type="button" onClick={() => set('formaPago', fp)}
                    className={`px-4 py-2 rounded-[8px] text-sm font-medium border transition-all duration-150 ${
                      form.formaPago === fp
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                    }`}>
                    {fp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Switch checked={form.descuentoAplicado || false} onCheckedChange={v => set('descuentoAplicado', v)} />
              <Label>Descuento Aplicado</Label>
              {form.descuentoAplicado && (
                <Input type="number" min="0" value={form.descuentoMonto || ''} onChange={e => set('descuentoMonto', parseFloat(e.target.value) || 0)} className="w-36 rounded-[10px] font-mono" placeholder="Monto ¢" />
              )}
            </div>
          </section>

          {/* Producción */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Producción</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Diseñado por</Label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {['Sin asignar', ...DISENO_OPTIONS].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => set('disenadoPor', opt === 'Sin asignar' ? undefined : opt)}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-all ${
                        (form.disenadoPor || 'Sin asignar') === opt
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Impreso por</Label>
                <Input value={form.impresoPor || ''} onChange={e => set('impresoPor', e.target.value)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Numerado por</Label>
                <Input value={form.numeradoPor || ''} onChange={e => set('numeradoPor', e.target.value)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Empacado por</Label>
                <Input value={form.empacadoPor || ''} onChange={e => set('empacadoPor', e.target.value)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Coleccionado por</Label>
                <Input value={form.coleccionadoPor || ''} onChange={e => set('coleccionadoPor', e.target.value)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Refilado por</Label>
                <Input value={form.refiladoPor || ''} onChange={e => set('refiladoPor', e.target.value)} className="mt-1 rounded-[10px]" />
              </div>
            </div>
          </section>

          {/* Notas */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Observaciones</h3>
            <Textarea rows={3} value={form.notasAdicionales || ''} onChange={e => set('notasAdicionales', e.target.value)} className="rounded-[10px]" placeholder="Observaciones adicionales..." />
          </section>

          {saveError && (
            <div className="p-4 rounded-[10px] bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
              ❌ {saveError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-6 py-3 rounded-[10px] border border-border hover:bg-muted transition-smooth font-medium flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#34D399] text-[#065F46] font-medium transition-smooth hover:bg-[#10B981] shadow-md disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
