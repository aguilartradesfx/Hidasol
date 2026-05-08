'use client';

/* OrderForm - Hidasol Order Management */
import { useState, useEffect, useMemo } from 'react';
import { useAuth, getFieldPermission, canEditFullOrder } from '@/contexts/auth-context';
import { 
  Order, OrderStatus, CanalContacto, MaterialPrincipal, FormaPago, 
  TipoDiseno, MaterialCorporeo, EstructuraCorporeo,
  MaquinaAsignada, Acabado, CorporeoOption, UnidadMedida,
  ACABADOS_OPTIONS, MATERIAL_TIPO_MAP, MAQUINAS_OPTIONS, CORPOREO_MULTI_OPTIONS,
  calcularSaldo, calcularMontoConIVA, cmToInches, inchesToCm
} from '@/types/order';
import { formatCurrency } from '@/lib/order-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X, ChevronDown, ChevronRight, FileText, Check, ExternalLink, Ruler } from 'lucide-react';

interface OrderFormProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => Promise<{ error: string | null }>;
}

function createEmptyOrder(): Partial<Order> {
  return {
    cliente: '',
    contactoWhatsApp: '',
    correo: '',
    canalContacto: 'WhatsApp',
    realizadaPorCliente: '',
    encargadoPor: '',
    ubicacionCliente: '',
    estado: 'Nueva',
    fechaIngreso: new Date(),
    productoNombre: '',
    productoId: '',
    tipoTrabajo: '',
    cantidad: 1,
    unidadMedida: 'cm',
    materialPrincipal: 'Lona',
    tipoMaterial: '',
    alto: 0,
    ancho: 0,
    colorImpresion: '',
    tecnica: '',
    caras: '',
    acabados: [],
    corporeoMulti: [],
    requiereInstalacion: false,
    disenoListo: false,
    formaPago: 'Contado',
    facturaElectronica: false,
    valorTotal: 0,
    abono: 0,
    incluirIVA: false,
  };
}

// Collapsible section component
function FormSection({ 
  title, 
  defaultOpen = true, 
  children,
  badge
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-border/60 rounded-[10px] overflow-hidden bg-card/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-muted/40 transition-smooth"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <h3 className="text-base sm:text-lg font-semibold font-['Bricolage_Grotesque'] text-foreground text-left">{title}</h3>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{badge}</span>
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-3 sm:px-5 pb-4 sm:pb-5 pt-2 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

const DISENO_OPTIONS = ['Arte 1', 'Arte 2', 'Arte 3', 'Arte 4'];

export function OrderForm({ order, isOpen, onClose, onSave }: OrderFormProps) {
  const { userRole } = useAuth();
  const [formData, setFormData] = useState<Partial<Order>>(createEmptyOrder());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setFormData({ ...order });
    } else {
      setFormData(createEmptyOrder());
    }
    setSaveError(null);
  }, [order, isOpen]);

  const isEditMode = !!order;
  const canFullEdit = canEditFullOrder(userRole);

  const isFieldEditable = (field: string): boolean => {
    return getFieldPermission(userRole, field) === 'edit';
  };

  const tipoMaterialOptions = useMemo(() => {
    const mp = formData.materialPrincipal;
    if (!mp) return [];
    return MATERIAL_TIPO_MAP[mp] || [];
  }, [formData.materialPrincipal]);

  const saldo = calcularSaldo({ 
    valorTotal: formData.valorTotal || 0, 
    abono: formData.abono || 0 
  } as Order);
  
  const montoConIVA = calcularMontoConIVA({ 
    valorTotal: formData.valorTotal || 0, 
    incluirIVA: formData.incluirIVA || false 
  } as Order);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    
    const orderToSave: Order = {
      id: order?.id || 'TEMP',
      cliente: formData.cliente || '',
      contactoWhatsApp: formData.contactoWhatsApp || '',
      correo: formData.correo || '',
      canalContacto: formData.canalContacto || 'WhatsApp',
      realizadaPorCliente: formData.realizadaPorCliente,
      encargadoPor: formData.encargadoPor,
      ubicacionCliente: formData.ubicacionCliente,
      estado: formData.estado || 'Nueva',
      fechaIngreso: isEditMode ? (formData.fechaIngreso || new Date()) : new Date(),
      fechaLimite: formData.fechaLimite,
      productoNombre: formData.productoNombre || '',
      productoId: formData.productoId || '',
      tipoTrabajo: formData.tipoTrabajo || '',
      cantidad: formData.cantidad || 1,
      unidadMedida: formData.unidadMedida || 'cm',
      materialPrincipal: formData.materialPrincipal || 'Lona',
      tipoMaterial: formData.tipoMaterial || '',
      grosorMaterial: formData.grosorMaterial,
      colorMaterial: formData.colorMaterial,
      instalacionTipo: formData.instalacionTipo,
      bannerDetalle: formData.bannerDetalle,
      alto: formData.alto || 0,
      ancho: formData.ancho || 0,
      colorImpresion: formData.colorImpresion || '',
      tecnica: formData.tecnica || '',
      caras: formData.caras || '',
      acabados: formData.acabados || [],
      corporeoMulti: formData.corporeoMulti,
      corporeoTipo: formData.corporeoTipo,
      corporeoColor: formData.corporeoColor,
      corporeoFuente: formData.corporeoFuente,
      corporeoMaterial: formData.corporeoMaterial,
      corporeoGrosor: formData.corporeoGrosor,
      corporeoEstructura: formData.corporeoEstructura,
      colorManguera: formData.colorManguera,
      requiereInstalacion: formData.requiereInstalacion || false,
      lugarInstalacion: formData.lugarInstalacion,
      fechaEntrega: formData.fechaEntrega,
      disenoListo: formData.disenoListo || false,
      tipoDiseno: formData.tipoDiseno,
      disenadoPor: formData.disenadoPor,
      fechaEnvioArte: formData.fechaEnvioArte,
      fechaAprobacion: formData.fechaAprobacion,
      maquinaAsignada: formData.maquinaAsignada,
      impresoPor: formData.impresoPor,
      realizadaPor: formData.realizadaPor,
      finalizadoPor: formData.finalizadoPor,
      fechaImpresion: formData.fechaImpresion,
      fechaIngresoRotulacion: formData.fechaIngresoRotulacion,
      fechaSalida: formData.fechaSalida,
      metrosImpresos: formData.metrosImpresos,
      metrosDesperdicio: formData.metrosDesperdicio,
      mlUsoTinta: formData.mlUsoTinta,
      formaPago: formData.formaPago || 'Contado',
      facturaElectronica: formData.facturaElectronica || false,
      facturarANombreDe: formData.facturarANombreDe,
      cedulaJuridica: formData.cedulaJuridica,
      valorTotal: formData.valorTotal || 0,
      abono: formData.abono || 0,
      incluirIVA: formData.incluirIVA || false,
      especificaciones: formData.especificaciones,
      notasAdicionales: formData.notasAdicionales,
      contactId: formData.contactId,
    };

    try {
      const result = await onSave(orderToSave);
      if (result.error) {
        setSaveError(result.error);
      }
    } catch (err: any) {
      console.error('Error saving order:', err);
      setSaveError(err?.message || 'Error inesperado al guardar la orden.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Order, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'materialPrincipal') {
        updated.tipoMaterial = '';
        updated.grosorMaterial = undefined;
        updated.colorMaterial = undefined;
        updated.instalacionTipo = undefined;
        updated.bannerDetalle = undefined;
      }
      return updated;
    });
  };

  const toggleMaquina = (maquina: MaquinaAsignada) => {
    setFormData(prev => {
      const current: MaquinaAsignada[] = Array.isArray(prev.maquinaAsignada)
        ? prev.maquinaAsignada
        : prev.maquinaAsignada ? [prev.maquinaAsignada] : [];
      const updated = current.includes(maquina)
        ? current.filter(m => m !== maquina)
        : [...current, maquina];
      return { ...prev, maquinaAsignada: updated };
    });
  };

  const toggleAcabado = (acabado: Acabado) => {
    setFormData(prev => {
      const current = prev.acabados || [];
      const updated = current.includes(acabado)
        ? current.filter(a => a !== acabado)
        : [...current, acabado];
      return { ...prev, acabados: updated };
    });
  };

  const toggleCorporeoOption = (option: CorporeoOption) => {
    setFormData(prev => {
      const current = prev.corporeoMulti || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, corporeoMulti: updated };
    });
  };

  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Nueva': return 'bg-[#FCD34D] text-[#92400E]';
      case 'En proceso': return 'bg-[#60A5FA] text-[#1E3A8A]';
      case 'Terminado': return 'bg-[#34D399] text-[#065F46]';
    }
  };

  const getConvertedValue = (valueCm: number, unit: UnidadMedida): string => {
    if (unit === 'cm') {
      return `≈ ${cmToInches(valueCm)} in`;
    } else {
      return `≈ ${inchesToCm(valueCm)} cm`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-background border-border w-[calc(100vw-1.5rem)] sm:w-[calc(100%-2rem)] md:w-full rounded-[15px]">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold font-['Bricolage_Grotesque']">
            {isEditMode ? 'Editar Orden' : 'Nueva Orden'}
          </DialogTitle>
          {!canFullEdit && (
            <p className="text-sm text-muted-foreground mt-1">
              Solo puedes editar los campos de tu área ({userRole}).
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          {/* ========== Sección 1 — Información del Cliente ========== */}
          <FormSection title="1 — Información del Cliente">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label>Nombre del cliente *</Label>
                <Input
                  required
                  value={formData.cliente || ''}
                  onChange={(e) => updateField('cliente', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="Nombre completo o razón social"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Contacto WhatsApp</Label>
                <Input
                  value={formData.contactoWhatsApp || ''}
                  onChange={(e) => updateField('contactoWhatsApp', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="+506 8888 8888"
                  type="tel"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.correo || ''}
                  onChange={(e) => updateField('correo', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="correo@ejemplo.com"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Canal de contacto</Label>
                <Select
                  value={formData.canalContacto || 'WhatsApp'}
                  onValueChange={(v) => updateField('canalContacto', v as CanalContacto)}
                  disabled={!canFullEdit}
                >
                  <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['WhatsApp', 'Instagram', 'Facebook', 'Sistema', 'Correo'] as CanalContacto[]).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Realizada por</Label>
                <Input
                  value={formData.realizadaPorCliente || ''}
                  onChange={(e) => updateField('realizadaPorCliente', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="Persona del cliente que solicitó el trabajo"
                  readOnly={!canFullEdit}
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label>Ubicación del cliente</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={formData.ubicacionCliente || ''}
                    onChange={(e) => updateField('ubicacionCliente', e.target.value)}
                    className="flex-1 rounded-[10px]"
                    placeholder="Link de Waze o Google Maps"
                    readOnly={!canFullEdit}
                  />
                  {formData.ubicacionCliente && (
                    <a
                      href={formData.ubicacionCliente}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-[10px] bg-primary/10 text-primary hover:bg-primary/20 transition-smooth flex items-center gap-1.5 text-sm font-medium shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir
                    </a>
                  )}
                </div>
              </div>
            </div>
          </FormSection>

          {/* ========== Sección 2 — Facturación ========== */}
          <FormSection title="2 — Facturación">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Forma de pago</Label>
                  <Select
                    value={formData.formaPago || 'Contado'}
                    onValueChange={(v) => updateField('formaPago', v as FormaPago)}
                    disabled={!canFullEdit}
                  >
                    <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Contado', 'Crédito', 'Sin Factura'] as FormaPago[]).map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.facturaElectronica || false}
                      onCheckedChange={(checked) => updateField('facturaElectronica', checked)}
                      disabled={!canFullEdit}
                    />
                    <Label>Factura electrónica</Label>
                  </div>
                </div>
              </div>

              {formData.facturaElectronica && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div>
                    <Label>Facturar a nombre de</Label>
                    <Input
                      value={formData.facturarANombreDe || ''}
                      onChange={(e) => updateField('facturarANombreDe', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      readOnly={!canFullEdit}
                    />
                  </div>
                  <div>
                    <Label>Cédula jurídica</Label>
                    <Input
                      value={formData.cedulaJuridica || ''}
                      onChange={(e) => updateField('cedulaJuridica', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="X-XXX-XXXXXX"
                      readOnly={!canFullEdit}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Valor total (¢)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.valorTotal || ''}
                    onChange={(e) => updateField('valorTotal', parseFloat(e.target.value) || 0)}
                    className="mt-1 rounded-[10px]"
                    readOnly={!canFullEdit}
                  />
                </div>
                <div>
                  <Label>Abono (¢)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.abono || ''}
                    onChange={(e) => updateField('abono', parseFloat(e.target.value) || 0)}
                    className="mt-1 rounded-[10px]"
                    readOnly={!canFullEdit}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-[10px] bg-muted/50 border border-border">
                  <Label className="text-xs text-muted-foreground">Saldo (calculado)</Label>
                  <p className="text-xl font-bold font-mono text-primary mt-1">{formatCurrency(saldo)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.incluirIVA || false}
                      onCheckedChange={(checked) => updateField('incluirIVA', checked)}
                      disabled={!canFullEdit}
                    />
                    <Label>Incluir IVA (13%)</Label>
                  </div>
                  {formData.incluirIVA && (
                    <div className="p-3 rounded-[10px] bg-muted/50 border border-border animate-in fade-in duration-200">
                      <Label className="text-xs text-muted-foreground">Monto con IVA</Label>
                      <p className="text-xl font-bold font-mono text-foreground mt-1">{formatCurrency(montoConIVA)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </FormSection>

          {/* ========== Sección 3 — Info de la Orden ========== */}
          <FormSection title="3 — Info de la Orden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Order ID</Label>
                <Input
                  value={order?.id || 'Se generará automáticamente'}
                  readOnly
                  disabled
                  className="mt-1 rounded-[10px] font-mono bg-muted/50 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>
                  Fecha de ingreso{' '}
                  <span className="text-xs text-muted-foreground">(auto)</span>
                </Label>
                <Input
                  type="text"
                  value={formData.fechaIngreso ? new Date(formData.fechaIngreso).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                  readOnly
                  disabled
                  className="mt-1 rounded-[10px] bg-muted/50 cursor-not-allowed"
                />
              </div>
              <div>
                <Label>Deadline / Fecha límite</Label>
                <Input
                  type="date"
                  value={formatDateForInput(formData.fechaLimite)}
                  onChange={(e) => updateField('fechaLimite', e.target.value ? new Date(e.target.value) : undefined)}
                  className="mt-1 rounded-[10px] w-full"
                  readOnly={!canFullEdit}
                  disabled={!canFullEdit}
                />
              </div>
              <div>
                <Label>Producto nombre</Label>
                <Input
                  value={formData.productoNombre || ''}
                  onChange={(e) => updateField('productoNombre', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="Nombre del producto"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Producto ID</Label>
                <Input
                  value={formData.productoId || ''}
                  onChange={(e) => updateField('productoId', e.target.value)}
                  className="mt-1 rounded-[10px] font-mono"
                  placeholder="PROD-001"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Tipo de trabajo</Label>
                <Input
                  value={formData.tipoTrabajo || ''}
                  onChange={(e) => updateField('tipoTrabajo', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="Ej: Impresión gran formato"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.cantidad || 1}
                  onChange={(e) => updateField('cantidad', parseInt(e.target.value) || 1)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!canFullEdit}
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label className="mb-2 block">Estado</Label>
                <div className="flex gap-2 flex-wrap">
                  {isEditMode ? (
                    (['Nueva', 'En proceso', 'Terminado'] as OrderStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => canFullEdit && updateField('estado', status)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition-smooth ${
                          formData.estado === status 
                            ? `${getStatusColor(status)} shadow-md scale-105` 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        } ${!canFullEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {status}
                      </button>
                    ))
                  ) : (
                    <div className={`px-5 py-2 rounded-full text-sm font-semibold ${getStatusColor('Nueva')} shadow-md`}>
                      Nueva
                    </div>
                  )}
                </div>
                {!isEditMode && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Las nuevas órdenes siempre se crean con estado &quot;Nueva&quot;.
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* ========== Sección 4 — Medidas y Material ========== */}
          <FormSection title="4 — Medidas y Material">
            <div className="space-y-4">
              {/* Unit selector */}
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-muted/30 border border-border/50">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Unidad de medida:</Label>
                <div className="flex gap-1">
                  {(['cm', 'in'] as UnidadMedida[]).map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => canFullEdit && updateField('unidadMedida', unit)}
                      className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-smooth ${
                        (formData.unidadMedida || 'cm') === unit
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      } ${!canFullEdit ? 'cursor-not-allowed' : ''}`}
                    >
                      {unit === 'cm' ? 'Centímetros' : 'Pulgadas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Alto ({formData.unidadMedida || 'cm'})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.alto || ''}
                    onChange={(e) => updateField('alto', parseFloat(e.target.value) || 0)}
                    className="mt-1 rounded-[10px]"
                    readOnly={!canFullEdit}
                  />
                  {(formData.alto || 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getConvertedValue(formData.alto || 0, formData.unidadMedida || 'cm')}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Ancho ({formData.unidadMedida || 'cm'})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.ancho || ''}
                    onChange={(e) => updateField('ancho', parseFloat(e.target.value) || 0)}
                    className="mt-1 rounded-[10px]"
                    readOnly={!canFullEdit}
                  />
                  {(formData.ancho || 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getConvertedValue(formData.ancho || 0, formData.unidadMedida || 'cm')}
                    </p>
                  )}
                </div>
              </div>

              {/* Material */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Material principal</Label>
                  <Select
                    value={formData.materialPrincipal || 'Lona'}
                    onValueChange={(v) => updateField('materialPrincipal', v as MaterialPrincipal)}
                    disabled={!canFullEdit}
                  >
                    <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Lona', 'PVC', 'Acrílico', 'Poli', 'Otros', 'Estructura', 'Vinil', 'Formatos', 'Plotter', 'Corpóreos'] as MaterialPrincipal[]).map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de material</Label>
                  {tipoMaterialOptions.length > 0 ? (
                    <Select
                      value={formData.tipoMaterial || ''}
                      onValueChange={(v) => updateField('tipoMaterial', v)}
                      disabled={!canFullEdit}
                    >
                      <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                      <SelectContent>
                        {tipoMaterialOptions.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.tipoMaterial || ''}
                      onChange={(e) => updateField('tipoMaterial', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Especificar tipo..."
                      readOnly={!canFullEdit}
                    />
                  )}
                </div>
                {formData.materialPrincipal === 'Acrílico' && formData.tipoMaterial === 'Otro' && (
                  <div>
                    <Label>Especificar color de acrílico</Label>
                    <Input
                      value={formData.colorMaterial || ''}
                      onChange={(e) => updateField('colorMaterial', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Escribir color..."
                      readOnly={!canFullEdit}
                    />
                  </div>
                )}
                {(formData.materialPrincipal === 'PVC' || formData.materialPrincipal === 'Acrílico' || formData.materialPrincipal === 'Poli') && (
                  <div>
                    <Label>
                      {formData.materialPrincipal === 'Poli' ? 'Grosor' : 'Grosor (mm)'}
                    </Label>
                    {formData.materialPrincipal === 'Poli' ? (
                      <Select
                        value={formData.grosorMaterial || ''}
                        onValueChange={(v) => updateField('grosorMaterial', v)}
                        disabled={!canFullEdit}
                      >
                        <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar grosor..." /></SelectTrigger>
                        <SelectContent>
                          {MATERIAL_TIPO_MAP['Poli'].map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.grosorMaterial || ''}
                        onChange={(e) => updateField('grosorMaterial', e.target.value)}
                        className="mt-1 rounded-[10px]"
                        placeholder="Ej: 3"
                        readOnly={!canFullEdit}
                      />
                    )}
                  </div>
                )}
                {formData.materialPrincipal === 'PVC' && (
                  <div>
                    <Label>Color</Label>
                    <Select
                      value={formData.colorMaterial || ''}
                      onValueChange={(v) => updateField('colorMaterial', v)}
                      disabled={!canFullEdit}
                    >
                      <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar color..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Negro">Negro</SelectItem>
                        <SelectItem value="Blanco">Blanco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.materialPrincipal === 'Estructura' && (
                  <div>
                    <Label>Instalación</Label>
                    <Select
                      value={formData.instalacionTipo || ''}
                      onValueChange={(v) => updateField('instalacionTipo', v)}
                      disabled={!canFullEdit}
                    >
                      <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Andamios">Andamios</SelectItem>
                        <SelectItem value="Escalera">Escalera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.materialPrincipal === 'Formatos' && formData.tipoMaterial === 'Banner' && (
                  <div>
                    <Label>Detalle Banner</Label>
                    <Select
                      value={formData.bannerDetalle || ''}
                      onValueChange={(v) => updateField('bannerDetalle', v)}
                      disabled={!canFullEdit}
                    >
                      <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tubos y Tapones">Tubos y Tapones</SelectItem>
                        <SelectItem value="Mecate">Mecate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.materialPrincipal === 'Corpóreos' && (
                  <div>
                    <Label>Color</Label>
                    <Input
                      value={formData.colorMaterial || ''}
                      onChange={(e) => updateField('colorMaterial', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Especificar color..."
                      readOnly={!canFullEdit}
                    />
                  </div>
                )}
              </div>

              {/* Impresión */}
              <div className="pt-2 border-t border-border/40">
                <Label className="text-base font-semibold mb-3 block">Impresión</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Color / Impresión</Label>
                    <Input
                      value={formData.colorImpresion || ''}
                      onChange={(e) => updateField('colorImpresion', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Ej: Full color CMYK"
                      readOnly={!canFullEdit}
                    />
                  </div>
                  <div>
                    <Label>Técnica</Label>
                    <Input
                      value={formData.tecnica || ''}
                      onChange={(e) => updateField('tecnica', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Ej: Impresión directa"
                      readOnly={!canFullEdit}
                    />
                  </div>
                  <div>
                    <Label>Caras</Label>
                    <Input
                      value={formData.caras || ''}
                      onChange={(e) => updateField('caras', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Ej: 1 cara"
                      readOnly={!canFullEdit}
                    />
                  </div>
                </div>
              </div>

              {/* Acabados */}
              <div className="pt-2 border-t border-border/40">
                <Label className="text-base font-semibold mb-3 block">
                  Acabados <span className="text-xs font-normal text-muted-foreground">({(formData.acabados || []).length} seleccionados)</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {ACABADOS_OPTIONS.map(acabado => {
                    const isSelected = (formData.acabados || []).includes(acabado);
                    return (
                      <button
                        key={acabado}
                        type="button"
                        onClick={() => canFullEdit && toggleAcabado(acabado)}
                        className={`px-3 py-2 rounded-[8px] text-sm font-medium transition-smooth border text-left flex items-center gap-2 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                        } ${!canFullEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{acabado}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Corpóreos — multi-select */}
              <div className="pt-2 border-t border-border/40">
                <Label className="text-base font-semibold mb-3 block">
                  Corpóreos <span className="text-xs font-normal text-muted-foreground">({(formData.corporeoMulti || []).length} seleccionados)</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {CORPOREO_MULTI_OPTIONS.map(option => {
                    const isSelected = (formData.corporeoMulti || []).includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => canFullEdit && toggleCorporeoOption(option)}
                        className={`px-3 py-2.5 rounded-[8px] text-sm font-medium transition-smooth border text-left flex items-center gap-2 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                        } ${!canFullEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Color corpóreo</Label>
                    <Input
                      value={formData.corporeoColor || ''}
                      onChange={(e) => updateField('corporeoColor', e.target.value)}
                      className="mt-1 rounded-[10px]"
                      placeholder="Ej: Blanco"
                      readOnly={!canFullEdit}
                    />
                  </div>
                  <div>
                    <Label>Fuente (eléctrica)</Label>
                    <div className="flex gap-2 mt-1">
                      {(['Si', 'No'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => canFullEdit && updateField('corporeoFuente', opt)}
                          className={`flex-1 px-3 py-2 rounded-[10px] text-sm font-medium transition-smooth border ${
                            formData.corporeoFuente === opt
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                          } ${!canFullEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Material corpóreo</Label>
                    <Select
                      value={formData.corporeoMaterial || ''}
                      onValueChange={(v) => updateField('corporeoMaterial', v as MaterialCorporeo)}
                      disabled={!canFullEdit}
                    >
                      <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {(['PVC Negro', 'PVC Blanco', 'Acrílico Transparente', 'Acrílico Color', 'Acrílico Lechoso', 'Tubo', 'Lata', 'ACM'] as MaterialCorporeo[]).map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Grosor (mm)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.corporeoGrosor || ''}
                      onChange={(e) => updateField('corporeoGrosor', parseFloat(e.target.value) || undefined)}
                      className="mt-1 rounded-[10px]"
                      readOnly={!canFullEdit}
                    />
                  </div>
                  <div>
                    <Label>Estructura</Label>
                    <Select
                      value={formData.corporeoEstructura || ''}
                      onValueChange={(v) => updateField('corporeoEstructura', v as EstructuraCorporeo)}
                      disabled={!canFullEdit}
                    >
                      <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {(['Andamios', 'Escalera', 'Ninguna', 'Tubo', 'Lata', 'ACM'] as EstructuraCorporeo[]).map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.corporeoMulti || []).includes('LED Neón') && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label>Color de Manguera</Label>
                      <Input
                        value={formData.colorManguera || ''}
                        onChange={(e) => updateField('colorManguera', e.target.value)}
                        className="mt-1 rounded-[10px]"
                        placeholder="Ej: Rojo, Azul, Blanco cálido..."
                        readOnly={!canFullEdit}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Instalación */}
              <div className="pt-2 border-t border-border/40">
                <Label className="text-base font-semibold mb-3 block">Instalación</Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.requiereInstalacion || false}
                      onCheckedChange={(checked) => updateField('requiereInstalacion', checked)}
                      disabled={!canFullEdit}
                    />
                    <Label>¿Requiere instalación?</Label>
                  </div>
                  {formData.requiereInstalacion && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label>Lugar de instalación</Label>
                      <Input
                        value={formData.lugarInstalacion || ''}
                        onChange={(e) => updateField('lugarInstalacion', e.target.value)}
                        className="mt-1 rounded-[10px]"
                        placeholder="Dirección o referencia"
                        readOnly={!canFullEdit}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Fecha de entrega</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(formData.fechaEntrega)}
                      onChange={(e) => updateField('fechaEntrega', e.target.value ? new Date(e.target.value) : undefined)}
                      className="mt-1 rounded-[10px] max-w-xs"
                      readOnly={!canFullEdit}
                    />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          {/* ========== Sección 5 — Diseño ========== */}
          <FormSection title="5 — Diseño">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.disenoListo || false}
                  onCheckedChange={(checked) => updateField('disenoListo', checked)}
                  disabled={!canFullEdit && !isFieldEditable('disenoListo')}
                />
                <Label>Diseño listo</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de diseño</Label>
                  <Select
                    value={formData.tipoDiseno || ''}
                    onValueChange={(v) => updateField('tipoDiseno', v as TipoDiseno)}
                    disabled={!canFullEdit}
                  >
                    <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {(['Solo Impresión', 'Diseño Nuevo', 'Modificación', 'Arte en sistema'] as TipoDiseno[]).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Diseñado por{' '}
                    {userRole === 'diseno' && <span className="text-xs text-primary">(editable)</span>}
                  </Label>
                  <Select
                    value={formData.disenadoPor || '__none__'}
                    onValueChange={(v) => updateField('disenadoPor', v === '__none__' ? '' : v)}
                    disabled={!isFieldEditable('disenadoPor')}
                  >
                    <SelectTrigger className="mt-1 rounded-[10px]">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {DISENO_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Fecha envío a impresión{' '}
                    {userRole === 'diseno' && <span className="text-xs text-primary">(editable)</span>}
                  </Label>
                  <Input
                    type="date"
                    value={formatDateForInput(formData.fechaEnvioArte)}
                    onChange={(e) => updateField('fechaEnvioArte', e.target.value ? new Date(e.target.value) : undefined)}
                    className="mt-1 rounded-[10px]"
                    readOnly={!isFieldEditable('fechaEnvioArte')}
                  />
                </div>
                <div>
                  <Label>Fecha aprobación</Label>
                  <Input
                    type="date"
                    value={formatDateForInput(formData.fechaAprobacion)}
                    onChange={(e) => updateField('fechaAprobacion', e.target.value ? new Date(e.target.value) : undefined)}
                    className="mt-1 rounded-[10px]"
                    readOnly={!canFullEdit}
                  />
                </div>
              </div>
            </div>
          </FormSection>

          {/* ========== Sección 6 — Producción ========== */}
          <FormSection title="6 — Producción">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label className="text-base font-semibold mb-3 block">
                  Máquina asignada <span className="text-xs font-normal text-muted-foreground">({(Array.isArray(formData.maquinaAsignada) ? formData.maquinaAsignada : formData.maquinaAsignada ? [formData.maquinaAsignada] : []).length} seleccionadas)</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {MAQUINAS_OPTIONS.map(maquina => {
                    const selectedList: MaquinaAsignada[] = Array.isArray(formData.maquinaAsignada)
                      ? formData.maquinaAsignada
                      : formData.maquinaAsignada ? [formData.maquinaAsignada] : [];
                    const isSelected = selectedList.includes(maquina);
                    return (
                      <button
                        key={maquina}
                        type="button"
                        onClick={() => canFullEdit && toggleMaquina(maquina)}
                        className={`px-3 py-2 rounded-[8px] text-sm font-medium transition-smooth border text-left flex items-center gap-2 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'
                        } ${!canFullEdit ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{maquina}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>
                  Impreso por{' '}
                  {userRole === 'operario' && <span className="text-xs text-primary">(editable)</span>}
                </Label>
                <Input
                  value={formData.impresoPor || ''}
                  onChange={(e) => updateField('impresoPor', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!isFieldEditable('impresoPor')}
                />
              </div>
              <div>
                <Label>
                  Finalizado por{' '}
                  {userRole === 'taller' && <span className="text-xs text-primary">(editable)</span>}
                </Label>
                <Input
                  value={formData.finalizadoPor || ''}
                  onChange={(e) => updateField('finalizadoPor', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!isFieldEditable('finalizadoPor')}
                />
              </div>
              <div>
                <Label>Fecha de impresión</Label>
                <Input
                  type="date"
                  value={formatDateForInput(formData.fechaImpresion)}
                  onChange={(e) => updateField('fechaImpresion', e.target.value ? new Date(e.target.value) : undefined)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Fecha ingreso rotulación</Label>
                <Input
                  type="date"
                  value={formatDateForInput(formData.fechaIngresoRotulacion)}
                  onChange={(e) => updateField('fechaIngresoRotulacion', e.target.value ? new Date(e.target.value) : undefined)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Fecha salida</Label>
                <Input
                  type="date"
                  value={formatDateForInput(formData.fechaSalida)}
                  onChange={(e) => updateField('fechaSalida', e.target.value ? new Date(e.target.value) : undefined)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>
                  Metros impresos{' '}
                  {userRole === 'operario' && <span className="text-xs text-primary">(editable)</span>}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.metrosImpresos || ''}
                  onChange={(e) => updateField('metrosImpresos', parseFloat(e.target.value) || undefined)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!isFieldEditable('metrosImpresos')}
                />
              </div>
              <div>
                <Label>
                  Metros desperdicio{' '}
                  {userRole === 'operario' && <span className="text-xs text-primary">(editable)</span>}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.metrosDesperdicio || ''}
                  onChange={(e) => updateField('metrosDesperdicio', parseFloat(e.target.value) || undefined)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!isFieldEditable('metrosDesperdicio')}
                />
              </div>
              <div>
                <Label>
                  ML uso de tinta{' '}
                  {userRole === 'operario' && <span className="text-xs text-primary">(editable)</span>}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.mlUsoTinta || ''}
                  onChange={(e) => updateField('mlUsoTinta', parseFloat(e.target.value) || undefined)}
                  className="mt-1 rounded-[10px]"
                  readOnly={!isFieldEditable('mlUsoTinta')}
                />
              </div>
            </div>
          </FormSection>

          {/* ========== Sección 7 — Notas ========== */}
          <FormSection title="7 — Notas adicionales">
            <div className="space-y-4">
              <div>
                <Label>Especificaciones</Label>
                <Textarea
                  rows={3}
                  value={formData.especificaciones || ''}
                  onChange={(e) => updateField('especificaciones', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="Especificaciones técnicas del trabajo..."
                  readOnly={!canFullEdit}
                />
              </div>
              <div>
                <Label>Notas adicionales</Label>
                <Textarea
                  rows={3}
                  value={formData.notasAdicionales || ''}
                  onChange={(e) => updateField('notasAdicionales', e.target.value)}
                  className="mt-1 rounded-[10px]"
                  placeholder="Información adicional sobre la orden..."
                  readOnly={!canFullEdit}
                />
              </div>
            </div>
          </FormSection>

          {/* ========== Error banner ========== */}
          {saveError && (
            <div className="p-4 rounded-[10px] bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium animate-in fade-in duration-200">
              ❌ {saveError}
            </div>
          )}

          {/* ========== Botones de acción ========== */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 pb-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-[10px] border border-border hover:bg-muted transition-smooth font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            {canFullEdit && (
              <button
                type="button"
                onClick={() => updateField('estado', 'Nueva')}
                className="px-6 py-3 rounded-[10px] border border-primary/30 text-primary hover:bg-primary/5 transition-smooth font-medium flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Guardar borrador
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] bg-primary text-primary-foreground font-medium transition-smooth hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Orden')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
