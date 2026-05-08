'use client';

import { TipoOrden } from '@/types/order';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Stamp, FileText, Tag } from 'lucide-react';

interface OrderTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tipo: TipoOrden) => void;
}

const TIPOS = [
  {
    id: 'Rotulacion' as TipoOrden,
    label: 'Rotulación',
    description: 'Lonas, vinil, corpóreos, acrílico, estructuras, instalación.',
    icon: Tag,
    color: '#F97316',
    bg: 'bg-[#F97316]/10',
    border: 'border-[#F97316]/30 hover:border-[#F97316]',
  },
  {
    id: 'Sellos' as TipoOrden,
    label: 'Sellos',
    description: 'Pedidos de sellos automáticos, blancos o chapas.',
    icon: Stamp,
    color: '#60A5FA',
    bg: 'bg-[#60A5FA]/10',
    border: 'border-[#60A5FA]/30 hover:border-[#60A5FA]',
  },
  {
    id: 'Papeleria' as TipoOrden,
    label: 'Papelería',
    description: 'Órdenes de impresión: tarjetas, volantes, formularios y más.',
    icon: FileText,
    color: '#34D399',
    bg: 'bg-[#34D399]/10',
    border: 'border-[#34D399]/30 hover:border-[#34D399]',
  },
];

export function OrderTypeSelector({ isOpen, onClose, onSelect }: OrderTypeSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background border-border rounded-[15px] w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold font-['Bricolage_Grotesque']">
            Nueva Orden — <span className="text-[#F97316]">¿Qué tipo?</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Selecciona el tipo de trabajo para abrir el formulario correcto.</p>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {TIPOS.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.id}
                onClick={() => onSelect(tipo.id)}
                className={`group flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all duration-200 text-left ${tipo.bg} ${tipo.border} hover:scale-[1.01] active:scale-[0.99]`}
              >
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `${tipo.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: tipo.color }} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base font-['Bricolage_Grotesque'] text-foreground">
                    {tipo.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 leading-snug">
                    {tipo.description}
                  </div>
                </div>
                <div
                  className="ml-auto text-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  style={{ color: tipo.color }}
                >
                  →
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
