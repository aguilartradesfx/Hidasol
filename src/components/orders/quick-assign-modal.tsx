'use client';

import { useState, useRef, useEffect } from 'react';
import { UserPlus, ChevronDown, X, Inbox } from 'lucide-react';
import { Order } from '@/types/order';

const DISENO_OPTIONS = ['Arte 1', 'Arte 2', 'Arte 3', 'Arte 4'];

interface QuickAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onAssign: (orderId: string, designer: string) => void;
}

function OrderRow({ order, onAssign }: { order: Order; onAssign: (orderId: string, designer: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground font-mono">{order.id}</p>
        <p className="text-xs text-muted-foreground truncate">{order.cliente || '—'}</p>
        {order.tipoOrden && (
          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">{order.tipoOrden}</p>
        )}
      </div>

      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-secondary border border-border text-sm font-medium hover:border-primary/50 transition-all duration-150"
        >
          <span className="text-muted-foreground">Asignar</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-36 bg-card border border-border rounded-[10px] shadow-xl z-50 overflow-hidden">
            {DISENO_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  onAssign(order.id, opt);
                  setOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-accent transition-all duration-150"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickAssignModal({ isOpen, onClose, orders, onAssign }: QuickAssignModalProps) {
  if (!isOpen) return null;

  const unassigned = orders.filter(o => !o.disenadoPor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-[16px] shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold">Asignar Órdenes</h2>
            {unassigned.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
                {unassigned.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-2">
          {unassigned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Todas las órdenes están asignadas</p>
            </div>
          ) : (
            unassigned.map(order => (
              <OrderRow key={order.id} order={order} onAssign={onAssign} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
