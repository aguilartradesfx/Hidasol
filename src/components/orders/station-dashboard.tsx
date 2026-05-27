'use client';

import { Order } from '@/types/order';
import { Station, STATION_COLORS, daysInStation } from '@/lib/stations';
import { formatTimeAgo } from '@/lib/design-sessions-store';
import { User, Clock, ArrowRight, Inbox, AlertCircle } from 'lucide-react';

interface StationDashboardProps {
  station: Station;
  orders: Order[];
  user: { name: string };
  onOrderClick: (order: Order) => void;
  onSignOut: () => void;
}

export function StationDashboard({
  station,
  orders,
  user,
  onOrderClick,
  onSignOut,
}: StationDashboardProps) {
  const myOrders = orders
    .filter((o) => o.estacionActual === station)
    .sort((a, b) => {
      const aTime = a.estacionDesde ? new Date(a.estacionDesde).getTime() : 0;
      const bTime = b.estacionDesde ? new Date(b.estacionDesde).getTime() : 0;
      return aTime - bTime; // oldest first — process those that arrived earliest
    });

  const colors = STATION_COLORS[station];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#070D18] border-b border-[#1a2436] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F97316] to-[#C2410C] flex items-center justify-center">
            <span className="text-white font-bold text-xs font-['Bricolage_Grotesque']">H</span>
          </div>
          <span className="text-white font-bold font-['Bricolage_Grotesque']">
            Hida<span className="text-[#F97316]">sol</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#94A3B8] hidden sm:inline">{user.name}</span>
          <button
            onClick={onSignOut}
            className="text-xs text-[#64748B] hover:text-white transition-colors px-2 py-1 rounded-[6px] hover:bg-[#111827]"
          >
            Salir
          </button>
        </div>
      </div>

      <main className="p-4 pt-[72px] pb-6 lg:p-8 lg:pt-[72px]">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Station header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-[12px] font-bold shadow-md ${colors.bg} ${colors.text}`}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors.dot} ring-2 ring-white/40`} />
                {station}
              </span>
              <span className="text-sm text-muted-foreground">
                {myOrders.length} {myOrders.length === 1 ? 'orden' : 'órdenes'} pendiente{myOrders.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Las órdenes están ordenadas por tiempo de llegada. Trabajá primero las más antiguas.
            </p>
          </div>

          {/* Order list */}
          {myOrders.length === 0 ? (
            <div className="rounded-[16px] border border-border bg-card p-12 text-center space-y-3">
              <Inbox className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-lg font-bold font-['Bricolage_Grotesque']">Sin órdenes pendientes</p>
              <p className="text-sm text-muted-foreground">
                Cuando una orden llegue a esta estación va a aparecer aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((order) => (
                <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const days = daysInStation(order.estacionDesde);
  const stalled = days >= 3;
  const fromColors = order.estacionAnterior ? STATION_COLORS[order.estacionAnterior] : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-[12px] border bg-card p-4 transition-all duration-200 hover:scale-[1.01] hover:border-[#F97316]/50 ${
        stalled ? 'border-[#F97316]/40 bg-[#F97316]/5' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#F97316]">{order.id}</span>
            {order.tipoOrden && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                {order.tipoOrden}
              </span>
            )}
            {stalled && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#F97316]/20 text-[#F97316] font-semibold uppercase tracking-wide">
                <AlertCircle className="w-3 h-3" />
                Atrasada
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">{order.cliente}</span>
          </div>

          {order.productoNombre && (
            <p className="text-xs text-muted-foreground truncate">{order.productoNombre}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap pt-1">
            {order.estacionAnterior && fromColors && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-[10px] uppercase tracking-wide">Viene de</span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${fromColors.dot}`} />
                <span className="font-medium text-foreground">{order.estacionAnterior}</span>
              </span>
            )}
            {order.estacionDesde && (
              <span className={`inline-flex items-center gap-1 text-xs ${stalled ? 'text-[#F97316] font-semibold' : 'text-muted-foreground'}`}>
                <Clock className="w-3 h-3" />
                {formatTimeAgo(new Date(order.estacionDesde))}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );
}
