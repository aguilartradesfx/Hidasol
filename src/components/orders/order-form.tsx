'use client';

/* OrderForm - Hidasol Order Management
   - Crear orden nueva → wizard a pantalla completa (un bloque por paso).
   - Editar orden existente → modal con todas las secciones (como antes).
   Ambos modos comparten las mismas secciones de campos (una sola fuente de verdad). */
import { useState, useEffect } from 'react';
import { useAuth, getFieldPermission, canEditFullOrder } from '@/contexts/auth-context';
import {
  Order, OrderStatus, CanalContacto, FormaPago,
  TipoDiseno, MaquinaAsignada, OrderElemento,
  MAQUINAS_OPTIONS, calcularSaldo, calcularMontoConIVA, getElementos,
} from '@/types/order';
import { formatCurrency } from '@/lib/order-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ElementosSection } from './elemento-editor';
import { WizardShell } from './wizard-shell';
import { Save, X, ChevronDown, ChevronRight, FileText, Check, ExternalLink } from 'lucide-react';

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
    elementos: [{ cantidad: 1, unidadMedida: 'cm', materialPrincipal: 'Lona', acabados: [], corporeoMulti: [] }],
    requiereInstalacion: false,
    disenoListo: false,
    formaPago: 'Contado',
    facturaElectronica: false,
    valorTotal: 0,
    abono: 0,
    incluirIVA: false,
  };
}

// Collapsible section component (modo editar)
function FormSection({
  title,
  defaultOpen = true,
  children,
  badge,
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

const STEP_TITLES = ['Cliente', 'Facturación', 'Datos', 'Elementos', 'Diseño', 'Producción', 'Notas'];

export function OrderForm({ order, isOpen, onClose, onSave }: OrderFormProps) {
  const { userRole } = useAuth();
  const [formData, setFormData] = useState<Partial<Order>>(createEmptyOrder());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (order) {
      setFormData({ ...order, elementos: getElementos(order) });
    } else {
      setFormData(createEmptyOrder());
    }
    setSaveError(null);
    setCurrentStep(0);
  }, [order, isOpen]);

  const isEditMode = !!order;
  const canFullEdit = canEditFullOrder(userRole);

  const isFieldEditable = (field: string): boolean => {
    return getFieldPermission(userRole, field) === 'edit';
  };

  const saldo = calcularSaldo({
    valorTotal: formData.valorTotal || 0,
    abono: formData.abono || 0,
  } as Order);

  const montoConIVA = calcularMontoConIVA({
    valorTotal: formData.valorTotal || 0,
    incluirIVA: formData.incluirIVA || false,
  } as Order);

  const buildOrder = (): Order => ({
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
    elementos: formData.elementos,
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
    tipoOrden: formData.tipoOrden,
  });

  const doSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await onSave(buildOrder());
      if (result.error) setSaveError(result.error);
    } catch (err: any) {
      console.error('Error saving order:', err);
      setSaveError(err?.message || 'Error inesperado al guardar la orden.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Order, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateElementos = (elementos: OrderElemento[]) => {
    setFormData(prev => ({ ...prev, elementos }));
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

  // ── Render de cada bloque (compartido entre wizard y modal) ──────────────

  const renderCliente = () => (
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
  );

  const renderFacturacion = () => (
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
          <DecimalInput
            blankZero
            emptyValue={0}
            value={formData.valorTotal}
            onValueChange={(v) => updateField('valorTotal', v ?? 0)}
            className="mt-1 rounded-[10px]"
            readOnly={!canFullEdit}
          />
        </div>
        <div>
          <Label>Abono (¢)</Label>
          <DecimalInput
            blankZero
            emptyValue={0}
            value={formData.abono}
            onValueChange={(v) => updateField('abono', v ?? 0)}
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
  );

  const renderInfoOrden = () => (
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
  );

  const renderElementos = () => (
    <div className="space-y-5">
      <ElementosSection
        elementos={getElementos(formData)}
        canEdit={canFullEdit}
        onChange={updateElementos}
      />

      {/* Instalación — aplica a toda la orden */}
      <div className="border border-border/60 rounded-[10px] p-4 bg-card/40 space-y-4">
        <Label className="text-base font-semibold block">Instalación (toda la orden)</Label>
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
  );

  const renderDiseno = () => (
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
  );

  const renderProduccion = () => (
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
          {isFieldEditable('impresoPor') && !canFullEdit && <span className="text-xs text-primary">(editable)</span>}
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
          {isFieldEditable('metrosImpresos') && !canFullEdit && <span className="text-xs text-primary">(editable)</span>}
        </Label>
        <DecimalInput
          blankZero
          value={formData.metrosImpresos}
          onValueChange={(v) => updateField('metrosImpresos', v)}
          className="mt-1 rounded-[10px]"
          readOnly={!isFieldEditable('metrosImpresos')}
        />
      </div>
      <div>
        <Label>
          Metros desperdicio{' '}
          {isFieldEditable('metrosDesperdicio') && !canFullEdit && <span className="text-xs text-primary">(editable)</span>}
        </Label>
        <DecimalInput
          blankZero
          value={formData.metrosDesperdicio}
          onValueChange={(v) => updateField('metrosDesperdicio', v)}
          className="mt-1 rounded-[10px]"
          readOnly={!isFieldEditable('metrosDesperdicio')}
        />
      </div>
      <div>
        <Label>
          ML uso de tinta{' '}
          {isFieldEditable('mlUsoTinta') && !canFullEdit && <span className="text-xs text-primary">(editable)</span>}
        </Label>
        <DecimalInput
          blankZero
          value={formData.mlUsoTinta}
          onValueChange={(v) => updateField('mlUsoTinta', v)}
          className="mt-1 rounded-[10px]"
          readOnly={!isFieldEditable('mlUsoTinta')}
        />
      </div>
    </div>
  );

  const renderNotas = () => (
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
  );

  const stepRenderers = [
    renderCliente, renderFacturacion, renderInfoOrden, renderElementos,
    renderDiseno, renderProduccion, renderNotas,
  ];

  // ── Modo CREAR: wizard a pantalla completa ───────────────────────────────
  if (!isEditMode) {
    if (!isOpen) return null;
    const isLast = currentStep === STEP_TITLES.length - 1;
    const nextDisabled = currentStep === 0 && !(formData.cliente || '').trim();
    return (
      <WizardShell
        title="Nueva orden"
        stepTitles={STEP_TITLES}
        currentStep={currentStep}
        onClose={onClose}
        onBack={() => setCurrentStep(s => Math.max(0, s - 1))}
        onNext={() => { if (isLast) doSave(); else setCurrentStep(s => Math.min(STEP_TITLES.length - 1, s + 1)); }}
        onStepClick={(i) => setCurrentStep(i)}
        isLast={isLast}
        submitting={saving}
        nextDisabled={nextDisabled}
        error={saveError}
      >
        {stepRenderers[currentStep]()}
      </WizardShell>
    );
  }

  // ── Modo EDITAR: modal con todas las secciones ───────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-background border-border w-[calc(100vw-1.5rem)] sm:w-[calc(100%-2rem)] md:w-full rounded-[15px]">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold font-['Bricolage_Grotesque']">
            Editar Orden
          </DialogTitle>
          {!canFullEdit && (
            <p className="text-sm text-muted-foreground mt-1">
              Solo puedes editar los campos de tu área ({userRole}).
            </p>
          )}
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); doSave(); }} className="space-y-4 py-4">
          <FormSection title="1 — Información del Cliente">{renderCliente()}</FormSection>
          <FormSection title="2 — Facturación">{renderFacturacion()}</FormSection>
          <FormSection title="3 — Info de la Orden">{renderInfoOrden()}</FormSection>
          <FormSection title="4 — Elementos / Trabajos">{renderElementos()}</FormSection>
          <FormSection title="5 — Diseño">{renderDiseno()}</FormSection>
          <FormSection title="6 — Producción">{renderProduccion()}</FormSection>
          <FormSection title="7 — Notas adicionales">{renderNotas()}</FormSection>

          {saveError && (
            <div className="p-4 rounded-[10px] bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium animate-in fade-in duration-200">
              ❌ {saveError}
            </div>
          )}

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
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
