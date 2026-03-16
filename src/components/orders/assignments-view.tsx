'use client';

import { Order } from '@/types/order';
import { formatDate } from '@/lib/order-utils';
import { Palette, User } from 'lucide-react';

const DISENO_OPTIONS = ['Arte 1', 'Arte 2', 'Arte 3', 'Arte 4'];

interface AssignmentsViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

export function AssignmentsView({ orders, onOrderClick }: AssignmentsViewProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Nueva': return 'bg-[#FCD34D] text-[#92400E]';
      case 'En proceso': return 'bg-[#60A5FA] text-[#1E3A8A]';
      case 'Terminado': return 'bg-[#34D399] text-[#065F46]';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const assignedOrders = orders.filter(o => o.disenadoPor);
  const unassignedOrders = orders.filter(o => !o.disenadoPor && o.estado !== 'Terminado');

  return (
    <div className="space-y-8">
      {/* By designer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DISENO_OPTIONS.map(designer => {
          const group = assignedOrders.filter(o => o.disenadoPor === designer);
          return (
            <div key={designer} className="bg-card border border-border rounded-[15px] overflow-hidden" style={{ boxShadow: '0 5px 20px rgba(100,80,140,0.1), 0 10px 36px rgba(0,0,0,0.05)' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="w-9 h-9 rounded-[8px] bg-[#F97316]/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-[#F97316]" />
                </div>
                <div>
                  <h3 className="font-semibold font-['Bricolage_Grotesque'] text-foreground">{designer}</h3>
                  <p className="text-xs text-muted-foreground">{group.length} boleta{group.length !== 1 ? 's' : ''} asignada{group.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Orders */}
              <div className="divide-y divide-border">
                {group.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                    Sin boletas asignadas
                  </div>
                ) : (
                  group.map(order => (
                    <button
                      key={order.id}
                      onClick={() => onOrderClick(order)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-all duration-150 text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-[#F97316] shrink-0">{order.id}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{order.cliente}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.fechaIngreso)}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ml-3 ${getStatusStyles(order.estado)}`}>
                        {order.estado}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned */}
      {unassignedOrders.length > 0 && (
        <div className="bg-card border border-border rounded-[15px] overflow-hidden" style={{ boxShadow: '0 5px 20px rgba(100,80,140,0.1), 0 10px 36px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-9 h-9 rounded-[8px] bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold font-['Bricolage_Grotesque'] text-foreground">Sin asignar</h3>
              <p className="text-xs text-muted-foreground">{unassignedOrders.length} boleta{unassignedOrders.length !== 1 ? 's' : ''} pendiente{unassignedOrders.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {unassignedOrders.map(order => (
              <button
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-all duration-150 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-semibold text-[#F97316] shrink-0">{order.id}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.cliente}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.fechaIngreso)}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ml-3 ${getStatusStyles(order.estado)}`}>
                  {order.estado}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
