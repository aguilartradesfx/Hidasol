import { useState } from 'react';
import { Order, OrderStatus } from '@/types/order';
import { formatCurrency, formatDate } from '@/lib/order-utils';
import { Clock, User, Package, LayoutList, LayoutGrid } from 'lucide-react';

interface RecentOrdersProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export function RecentOrders({ orders, onOrderClick, onStatusChange }: RecentOrdersProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const recentOrders = orders.slice(0, 5);

  const getStatusStyles = (status: OrderStatus) => {
    switch (status) {
      case 'Nueva':
        return 'bg-[#60A5FA]/20 text-[#93C5FD] border border-[#60A5FA]/30';
      case 'En proceso':
        return 'bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/30';
      case 'Terminado':
        return 'bg-[#34D399]/20 text-[#6EE7B7] border border-[#34D399]/30';
    }
  };

  const cycleStatus = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const statuses: OrderStatus[] = ['Nueva', 'En proceso', 'Terminado'];
    const currentIndex = statuses.indexOf(order.estado);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(order.id, nextStatus);
  };

  return (
    <div className="bg-card rounded-[12px] p-4 lg:p-6 border border-border">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-['Bricolage_Grotesque'] text-foreground">
            Órdenes Recientes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Las 5 órdenes más recientes
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-[8px] bg-muted/50 border border-border">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-[6px] transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista de lista"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-[6px] transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista de cuadrícula"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {recentOrders.map((order, index) => (
            <div
              key={order.id}
              className="group p-4 rounded-[10px] border border-border hover:border-[#F97316]/40 transition-smooth cursor-pointer hover:bg-[#F97316]/5 animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 30}ms`, animationDuration: '300ms' }}
              onClick={() => onOrderClick(order)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-[#F97316]">
                      {order.id}
                    </span>
                    <button
                      onClick={(e) => cycleStatus(e, order)}
                      className={`px-3 py-1 rounded-[5px] text-xs font-medium transition-smooth hover:scale-105 active:scale-95 ${getStatusStyles(order.estado)}`}
                    >
                      {order.estado}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#64748B] shrink-0" />
                      <span className="font-medium text-foreground truncate">{order.cliente}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#64748B] shrink-0" />
                      <span className="truncate">{order.productoNombre}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(order.fechaIngreso)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base lg:text-lg font-semibold font-mono text-foreground">
                    {formatCurrency(order.valorTotal)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Cant: {order.cantidad}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentOrders.map((order, index) => (
            <div
              key={order.id}
              className="group p-4 rounded-[10px] border border-border hover:border-[#F97316]/40 transition-smooth cursor-pointer hover:bg-[#F97316]/5 animate-in fade-in slide-in-from-bottom flex flex-col gap-3"
              style={{ animationDelay: `${index * 40}ms`, animationDuration: '300ms' }}
              onClick={() => onOrderClick(order)}
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-medium text-[#F97316]">
                  {order.id}
                </span>
                <button
                  onClick={(e) => cycleStatus(e, order)}
                  className={`px-2.5 py-0.5 rounded-[5px] text-xs font-medium transition-smooth hover:scale-105 active:scale-95 ${getStatusStyles(order.estado)}`}
                >
                  {order.estado}
                </button>
              </div>

              {/* Client */}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-[#64748B] shrink-0" />
                <span className="font-medium text-foreground truncate">{order.cliente}</span>
              </div>

              {/* Product */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4 text-[#64748B] shrink-0" />
                <span className="truncate">{order.productoNombre}</span>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(order.fechaIngreso)}</span>
                </div>
                <div className="text-sm font-semibold font-mono text-foreground">
                  {formatCurrency(order.valorTotal)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
