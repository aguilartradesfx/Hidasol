'use client';

import { useState, useEffect } from 'react';
import { Order, TipoSello, FormaPago } from '@/types/order';
import { formatCurrency } from '@/lib/order-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';

interface SellosFormProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => Promise<{ error: string | null }>;
}

const TIPOS_SELLO: TipoSello[] = ['Automático', 'Blanco', 'Chapas'];
const FORMAS_PAGO: FormaPago[] = ['Efectivo', 'Tarjeta', 'Transferencia'];

function emptySellos(): Partial<Order> {
  return {
    tipoOrden: 'Sellos',
    cliente: '',
    contactoWhatsApp: '',
    estado: 'Nueva',
    fechaIngreso: new Date(),
    cantidad: 1,
    valorTotal: 0,
    abono: 0,
    incluirIVA: false,
    formaPago: 'Efectivo',
    descuentoAplicado: false,
    descuentoMonto: 0,
    productoNombre: '',
    productoId: '',
    tipoTrabajo: 'Sello',
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

export function SellosForm({ order, isOpen, onClose, onSave }: SellosFormProps) {
  const [form, setForm] = useState<Partial<Order>>(emptySellos());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setForm({ ...order });
    } else {
      setForm(emptySellos());
    }
    setSaveError(null);
  }, [order, isOpen]);

  const isEditMode = !!order;
  const set = (field: keyof Order, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const ivaAmount = form.incluirIVA ? (form.valorTotal || 0) * 0.13 : 0;
  const saldo = (form.valorTotal || 0) - (form.abono || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const orderToSave: Order = {
      id: order?.id || 'TEMP',
      tipoOrden: 'Sellos',
      cliente: form.cliente || '',
      contactoWhatsApp: form.contactoWhatsApp || '',
      correo: '',
      canalContacto: 'WhatsApp',
      estado: 'Nueva',
      fechaIngreso: isEditMode ? (form.fechaIngreso || new Date()) : new Date(),
      productoNombre: `Sello ${form.tipoSello || ''}`.trim(),
      productoId: form.productoId || '',
      tipoTrabajo: 'Sello',
      cantidad: form.cantidad || 1,
      unidadMedida: 'cm',
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
      formaPago: form.formaPago || 'Efectivo',
      facturaElectronica: false,
      valorTotal: form.valorTotal || 0,
      abono: form.abono || 0,
      incluirIVA: form.incluirIVA || false,
      tipoSello: form.tipoSello,
      modeloSello: form.modeloSello,
      espacioDiseno: form.espacioDiseno,
      descuentoAplicado: form.descuentoAplicado || false,
      descuentoMonto: form.descuentoMonto || 0,
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
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-background border-border w-[calc(100vw-1.5rem)] sm:w-full rounded-[15px]">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold font-['Bricolage_Grotesque']">
            {isEditMode ? 'Editar Orden' : 'Nueva Orden'}{' '}
            <span className="text-[#60A5FA]">— Sellos</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">

          {/* Cliente */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Nombre del cliente *</Label>
                <Input required value={form.cliente || ''} onChange={e => set('cliente', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Nombre o razón social" />
              </div>
              <div>
                <Label>Teléfono / WhatsApp</Label>
                <Input value={form.contactoWhatsApp || ''} onChange={e => set('contactoWhatsApp', e.target.value)} className="mt-1 rounded-[10px]" placeholder="+506 8888-8888" type="tel" />
              </div>
            </div>
          </section>

          {/* Tipo de Sello */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Tipo de Sello</h3>
            <div className="flex gap-2 flex-wrap">
              {TIPOS_SELLO.map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => set('tipoSello', tipo)}
                  className={`px-4 py-2 rounded-[8px] text-sm font-medium border transition-all duration-150 ${
                    form.tipoSello === tipo
                      ? 'bg-[#60A5FA]/20 border-[#60A5FA] text-[#60A5FA]'
                      : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Cantidad *</Label>
                <Input required type="number" min="1" value={form.cantidad || 1} onChange={e => set('cantidad', parseInt(e.target.value) || 1)} className="mt-1 rounded-[10px]" />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={form.modeloSello || ''} onChange={e => set('modeloSello', e.target.value)} className="mt-1 rounded-[10px]" placeholder="Ej: P4800, 4912..." />
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

            {/* Forma de pago */}
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

            {/* Descuento */}
            <div className="flex items-center gap-3 flex-wrap">
              <Switch checked={form.descuentoAplicado || false} onCheckedChange={v => set('descuentoAplicado', v)} />
              <Label>Descuento Aplicado</Label>
              {form.descuentoAplicado && (
                <Input
                  type="number" min="0"
                  value={form.descuentoMonto || ''}
                  onChange={e => set('descuentoMonto', parseFloat(e.target.value) || 0)}
                  className="w-36 rounded-[10px] font-mono"
                  placeholder="Monto ¢"
                />
              )}
            </div>
          </section>

          {/* Espacio para Diseño */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Espacio para Diseño</h3>
            <Textarea
              rows={5}
              value={form.espacioDiseno || ''}
              onChange={e => set('espacioDiseno', e.target.value)}
              className="rounded-[10px] font-mono text-sm"
              placeholder="Descripción o instrucciones del diseño del sello..."
            />
          </section>

          {/* Observaciones */}
          <section className="border border-border/60 rounded-[10px] p-4 space-y-3">
            <h3 className="font-semibold font-['Bricolage_Grotesque'] text-base">Observaciones</h3>
            <Textarea
              rows={3}
              value={form.notasAdicionales || ''}
              onChange={e => set('notasAdicionales', e.target.value)}
              className="rounded-[10px]"
              placeholder="Observaciones adicionales..."
            />
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
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-[#60A5FA] text-white font-medium transition-smooth hover:bg-[#3B82F6] shadow-md disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
