'use client';

/* ElementoEditor — edita un trabajo/elemento dentro de una orden.
   Una orden puede tener varios. Todos los campos son opcionales. */
import {
  OrderElemento, MaterialPrincipal, MaterialCorporeo, EstructuraCorporeo,
  Acabado, CorporeoOption, UnidadMedida,
  ACABADOS_OPTIONS, MATERIAL_TIPO_MAP, CORPOREO_MULTI_OPTIONS,
  cmToInches, inchesToCm,
} from '@/types/order';
import { Input } from '@/components/ui/input';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Ruler, Copy, Trash2, Plus } from 'lucide-react';

function getConvertedValue(value: number, unit: UnidadMedida): string {
  return unit === 'cm' ? `≈ ${cmToInches(value)} in` : `≈ ${inchesToCm(value)} cm`;
}

export function defaultElemento(): OrderElemento {
  return { cantidad: 1, unidadMedida: 'cm', materialPrincipal: 'Lona', acabados: [], corporeoMulti: [] };
}

interface ElementoEditorProps {
  elemento: OrderElemento;
  index: number;
  total: number;
  canEdit: boolean;
  onPatch: (partial: Partial<OrderElemento>) => void;
  onRemove: () => void;
  onCopyPrevious: () => void;
}

export function ElementoEditor({ elemento, index, total, canEdit, onPatch, onRemove, onCopyPrevious }: ElementoEditorProps) {
  const el = elemento;
  const unidad = el.unidadMedida || 'cm';
  const tipoMaterialOptions = el.materialPrincipal ? (MATERIAL_TIPO_MAP[el.materialPrincipal] || []) : [];

  const toggleAcabado = (a: Acabado) => {
    const cur = el.acabados || [];
    onPatch({ acabados: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };
  const toggleCorporeo = (o: CorporeoOption) => {
    const cur = el.corporeoMulti || [];
    onPatch({ corporeoMulti: cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o] });
  };
  const changeMaterial = (v: MaterialPrincipal) => {
    onPatch({ materialPrincipal: v, tipoMaterial: '', grosorMaterial: undefined, colorMaterial: undefined, instalacionTipo: undefined, bannerDetalle: undefined });
  };

  return (
    <div className="border border-border rounded-[12px] bg-card/60 overflow-hidden">
      {/* Header del elemento */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{index + 1}</span>
          <h4 className="font-semibold font-['Bricolage_Grotesque']">
            {el.productoNombre?.trim() ? el.productoNombre : `Elemento ${index + 1}`}
          </h4>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <button type="button" onClick={onCopyPrevious}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[8px] border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth">
                <Copy className="w-3.5 h-3.5" /> Copiar del anterior
              </button>
            )}
            {total > 1 && (
              <button type="button" onClick={onRemove} title="Eliminar elemento"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[8px] border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth">
                <Trash2 className="w-3.5 h-3.5" /> Quitar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Producto / descripción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Producto / trabajo</Label>
            <Input value={el.productoNombre || ''} onChange={(e) => onPatch({ productoNombre: e.target.value })}
              className="mt-1 rounded-[10px]" placeholder="Nombre del producto (opcional)" readOnly={!canEdit} />
          </div>
          <div>
            <Label>Cantidad</Label>
            <DecimalInput integer emptyValue={1} value={el.cantidad} onValueChange={(v) => onPatch({ cantidad: v })}
              className="mt-1 rounded-[10px]" readOnly={!canEdit} />
          </div>
          <div>
            <Label>Producto ID</Label>
            <Input value={el.productoId || ''} onChange={(e) => onPatch({ productoId: e.target.value })}
              className="mt-1 rounded-[10px] font-mono" placeholder="PROD-001" readOnly={!canEdit} />
          </div>
          <div>
            <Label>Tipo de trabajo</Label>
            <Input value={el.tipoTrabajo || ''} onChange={(e) => onPatch({ tipoTrabajo: e.target.value })}
              className="mt-1 rounded-[10px]" placeholder="Ej: Impresión gran formato" readOnly={!canEdit} />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <Label>Descripción</Label>
            <Input value={el.descripcion || ''} onChange={(e) => onPatch({ descripcion: e.target.value })}
              className="mt-1 rounded-[10px]" placeholder="Descripción del elemento (opcional)" readOnly={!canEdit} />
          </div>
        </div>

        {/* Unidad + medidas */}
        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-muted/30 border border-border/50">
          <Ruler className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm">Unidad de medida:</Label>
          <div className="flex gap-1">
            {(['cm', 'in'] as UnidadMedida[]).map(u => (
              <button key={u} type="button" onClick={() => canEdit && onPatch({ unidadMedida: u })}
                className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-smooth ${unidad === u ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'} ${!canEdit ? 'cursor-not-allowed' : ''}`}>
                {u === 'cm' ? 'Centímetros' : 'Pulgadas'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Alto ({unidad})</Label>
            <DecimalInput blankZero emptyValue={0} value={el.alto} onValueChange={(v) => onPatch({ alto: v })}
              className="mt-1 rounded-[10px]" placeholder="0" readOnly={!canEdit} />
            {(el.alto || 0) > 0 && <p className="text-xs text-muted-foreground mt-1">{getConvertedValue(el.alto || 0, unidad)}</p>}
          </div>
          <div>
            <Label>Ancho ({unidad})</Label>
            <DecimalInput blankZero emptyValue={0} value={el.ancho} onValueChange={(v) => onPatch({ ancho: v })}
              className="mt-1 rounded-[10px]" placeholder="0" readOnly={!canEdit} />
            {(el.ancho || 0) > 0 && <p className="text-xs text-muted-foreground mt-1">{getConvertedValue(el.ancho || 0, unidad)}</p>}
          </div>
        </div>

        {/* Material */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Material principal</Label>
            <Select value={el.materialPrincipal || 'Lona'} onValueChange={(v) => changeMaterial(v as MaterialPrincipal)} disabled={!canEdit}>
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
              <Select value={el.tipoMaterial || ''} onValueChange={(v) => onPatch({ tipoMaterial: v })} disabled={!canEdit}>
                <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                <SelectContent>
                  {tipoMaterialOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={el.tipoMaterial || ''} onChange={(e) => onPatch({ tipoMaterial: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Especificar tipo..." readOnly={!canEdit} />
            )}
          </div>
          {el.materialPrincipal === 'Acrílico' && el.tipoMaterial === 'Otro' && (
            <div>
              <Label>Especificar color de acrílico</Label>
              <Input value={el.colorMaterial || ''} onChange={(e) => onPatch({ colorMaterial: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Escribir color..." readOnly={!canEdit} />
            </div>
          )}
          {(el.materialPrincipal === 'PVC' || el.materialPrincipal === 'Acrílico' || el.materialPrincipal === 'Poli') && (
            <div>
              <Label>{el.materialPrincipal === 'Poli' ? 'Grosor' : 'Grosor (mm)'}</Label>
              {el.materialPrincipal === 'Poli' ? (
                <Select value={el.grosorMaterial || ''} onValueChange={(v) => onPatch({ grosorMaterial: v })} disabled={!canEdit}>
                  <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar grosor..." /></SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TIPO_MAP['Poli'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={el.grosorMaterial || ''} onChange={(e) => onPatch({ grosorMaterial: e.target.value })}
                  className="mt-1 rounded-[10px]" placeholder="Ej: 3" readOnly={!canEdit} />
              )}
            </div>
          )}
          {el.materialPrincipal === 'PVC' && (
            <div>
              <Label>Color</Label>
              <Select value={el.colorMaterial || ''} onValueChange={(v) => onPatch({ colorMaterial: v })} disabled={!canEdit}>
                <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar color..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negro">Negro</SelectItem>
                  <SelectItem value="Blanco">Blanco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {el.materialPrincipal === 'Estructura' && (
            <div>
              <Label>Instalación</Label>
              <Select value={el.instalacionTipo || ''} onValueChange={(v) => onPatch({ instalacionTipo: v })} disabled={!canEdit}>
                <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Andamios">Andamios</SelectItem>
                  <SelectItem value="Escalera">Escalera</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {el.materialPrincipal === 'Formatos' && el.tipoMaterial === 'Banner' && (
            <div>
              <Label>Detalle Banner</Label>
              <Select value={el.bannerDetalle || ''} onValueChange={(v) => onPatch({ bannerDetalle: v })} disabled={!canEdit}>
                <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tubos y Tapones">Tubos y Tapones</SelectItem>
                  <SelectItem value="Mecate">Mecate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {el.materialPrincipal === 'Corpóreos' && (
            <div>
              <Label>Color</Label>
              <Input value={el.colorMaterial || ''} onChange={(e) => onPatch({ colorMaterial: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Especificar color..." readOnly={!canEdit} />
            </div>
          )}
        </div>

        {/* Impresión */}
        <div className="pt-2 border-t border-border/40">
          <Label className="text-base font-semibold mb-3 block">Impresión</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Color / Impresión</Label>
              <Input value={el.colorImpresion || ''} onChange={(e) => onPatch({ colorImpresion: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Ej: Full color CMYK" readOnly={!canEdit} />
            </div>
            <div>
              <Label>Técnica</Label>
              <Input value={el.tecnica || ''} onChange={(e) => onPatch({ tecnica: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Ej: Impresión directa" readOnly={!canEdit} />
            </div>
            <div>
              <Label>Caras</Label>
              <Input value={el.caras || ''} onChange={(e) => onPatch({ caras: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Ej: 1 cara" readOnly={!canEdit} />
            </div>
          </div>
        </div>

        {/* Acabados */}
        <div className="pt-2 border-t border-border/40">
          <Label className="text-base font-semibold mb-3 block">
            Acabados <span className="text-xs font-normal text-muted-foreground">({(el.acabados || []).length} seleccionados)</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ACABADOS_OPTIONS.map(a => {
              const selected = (el.acabados || []).includes(a);
              return (
                <button key={a} type="button" onClick={() => canEdit && toggleAcabado(a)}
                  className={`px-3 py-2 rounded-[8px] text-sm font-medium transition-smooth border text-left flex items-center gap-2 ${selected ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'} ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}>
                  {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{a}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Corpóreos */}
        <div className="pt-2 border-t border-border/40">
          <Label className="text-base font-semibold mb-3 block">
            Corpóreos <span className="text-xs font-normal text-muted-foreground">({(el.corporeoMulti || []).length} seleccionados)</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {CORPOREO_MULTI_OPTIONS.map(o => {
              const selected = (el.corporeoMulti || []).includes(o);
              return (
                <button key={o} type="button" onClick={() => canEdit && toggleCorporeo(o)}
                  className={`px-3 py-2.5 rounded-[8px] text-sm font-medium transition-smooth border text-left flex items-center gap-2 ${selected ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'} ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}>
                  {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Color corpóreo</Label>
              <Input value={el.corporeoColor || ''} onChange={(e) => onPatch({ corporeoColor: e.target.value })}
                className="mt-1 rounded-[10px]" placeholder="Ej: Blanco" readOnly={!canEdit} />
            </div>
            <div>
              <Label>Fuente (eléctrica)</Label>
              <div className="flex gap-2 mt-1">
                {(['Si', 'No'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => canEdit && onPatch({ corporeoFuente: opt })}
                    className={`flex-1 px-3 py-2 rounded-[10px] text-sm font-medium transition-smooth border ${el.corporeoFuente === opt ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border text-muted-foreground hover:border-foreground/30'} ${!canEdit ? 'cursor-not-allowed opacity-70' : ''}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Material corpóreo</Label>
              <Select value={el.corporeoMaterial || ''} onValueChange={(v) => onPatch({ corporeoMaterial: v as MaterialCorporeo })} disabled={!canEdit}>
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
              <DecimalInput value={el.corporeoGrosor} onValueChange={(v) => onPatch({ corporeoGrosor: v })}
                className="mt-1 rounded-[10px]" readOnly={!canEdit} />
            </div>
            <div>
              <Label>Estructura</Label>
              <Select value={el.corporeoEstructura || ''} onValueChange={(v) => onPatch({ corporeoEstructura: v as EstructuraCorporeo })} disabled={!canEdit}>
                <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {(['Andamios', 'Escalera', 'Ninguna', 'Tubo', 'Lata', 'ACM'] as EstructuraCorporeo[]).map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(el.corporeoMulti || []).includes('LED Neón') && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <Label>Color de Manguera</Label>
                <Input value={el.colorManguera || ''} onChange={(e) => onPatch({ colorManguera: e.target.value })}
                  className="mt-1 rounded-[10px]" placeholder="Ej: Rojo, Azul, Blanco cálido..." readOnly={!canEdit} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ElementosSectionProps {
  elementos: OrderElemento[];
  canEdit: boolean;
  onChange: (elementos: OrderElemento[]) => void;
}

export function ElementosSection({ elementos, canEdit, onChange }: ElementosSectionProps) {
  const list = elementos.length > 0 ? elementos : [defaultElemento()];

  const patch = (i: number, partial: Partial<OrderElemento>) =>
    onChange(list.map((el, idx) => (idx === i ? { ...el, ...partial } : el)));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const copyPrevious = (i: number) =>
    onChange(list.map((el, idx) => (idx === i ? { ...list[i - 1] } : el)));
  const add = () => onChange([...list, defaultElemento()]);

  return (
    <div className="space-y-4">
      {list.map((el, i) => (
        <ElementoEditor
          key={i}
          elemento={el}
          index={i}
          total={list.length}
          canEdit={canEdit}
          onPatch={(partial) => patch(i, partial)}
          onRemove={() => remove(i)}
          onCopyPrevious={() => copyPrevious(i)}
        />
      ))}
      {canEdit && (
        <button type="button" onClick={add}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[10px] border-2 border-dashed border-primary/40 text-primary font-medium hover:bg-primary/5 transition-smooth">
          <Plus className="w-4 h-4" /> Agregar elemento
        </button>
      )}
    </div>
  );
}
