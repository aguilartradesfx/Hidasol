'use client';

import { Order, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/lib/order-utils';

interface OrderIconViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; dot: string; border: string }> = {
  'Nueva': {
    bg: 'bg-[#FCD34D]/20',
    text: 'text-[#92400E]',
    dot: 'bg-[#FCD34D]',
    border: 'border-[#FCD34D]/40',
  },
  'En proceso': {
    bg: 'bg-[#60A5FA]/20',
    text: 'text-[#1E3A8A]',
    dot: 'bg-[#60A5FA]',
    border: 'border-[#60A5FA]/40',
  },
  'Terminado': {
    bg: 'bg-[#34D399]/20',
    text: 'text-[#065F46]',
    dot: 'bg-[#34D399]',
    border: 'border-[#34D399]/40',
  },
};

function DocumentIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-sm"
    >
      {/* Page body */}
      <rect x="2" y="2" width="52" height="68" rx="5" fill="white" stroke={color} strokeWidth="1.5" />
      {/* Folded corner */}
      <path d="M40 2 L54 16 L40 16 Z" fill={color} opacity="0.25" />
      <path d="M40 2 L54 16 L40 16 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lines */}
      <line x1="10" y1="28" x2="44" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="10" y1="36" x2="44" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <line x1="10" y1="44" x2="36" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}

export function OrderIconView({ orders, onOrderClick, onStatusChange }: OrderIconViewProps) {
  const statuses: OrderStatus[] = ['Nueva', 'En proceso', 'Terminado'];

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 sm:gap-4">
      {orders.map((order) => {
        const s = STATUS_STYLES[order.estado];
        const iconColor =
          order.estado === 'Nueva'
            ? '#D97706'
            : order.estado === 'En proceso'
            ? '#3B82F6'
            : '#10B981';

        return (
          <div
            key={order.id}
            onClick={() => onOrderClick(order)}
            className={`
              group relative flex flex-col items-center gap-2 p-3 rounded-[12px] cursor-pointer
              border ${s.border} ${s.bg}
              hover:border-[#F97316]/50 hover:bg-[#F97316]/5
              transition-all duration-200 hover:scale-[1.03] hover:shadow-md
            `}
          >
            {/* Document icon */}
            <div className="w-14 h-[72px] mt-1">
              <DocumentIcon color={iconColor} />
            </div>

            {/* Order ID */}
            <span className="font-mono text-[11px] font-semibold text-[#F97316] leading-none">
              {order.id}
            </span>

            {/* Client name */}
            <span
              className="text-[12px] font-medium text-center leading-tight text-foreground line-clamp-2"
              style={{ fontFamily: 'Newsreader, serif' }}
            >
              {order.cliente}
            </span>

            {/* Product */}
            <span className="text-[11px] text-muted-foreground text-center leading-tight line-clamp-1">
              {order.productoNombre}
            </span>

            {/* Value */}
            <span className="font-mono text-[11px] font-semibold text-foreground">
              {formatCurrency(order.valorTotal)}
            </span>

            {/* Status badge — click to cycle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = statuses.indexOf(order.estado);
                const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                onStatusChange(order.id, nextStatus);
              }}
              className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                ${s.bg} ${s.text} border ${s.border}
                hover:opacity-80 transition-opacity
              `}
              title="Click para cambiar estado"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {order.estado}
            </button>
          </div>
        );
      })}

      {orders.length === 0 && (
        <div className="col-span-full py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-16 h-[82px] opacity-20">
            <DocumentIcon color="#9CA3AF" />
          </div>
          <p className="text-sm">No hay órdenes para mostrar</p>
        </div>
      )}
    </div>
  );
}
