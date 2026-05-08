import { Order, OrdersGroupedByDate, DashboardStats, calcularSaldo, calcularMontoConIVA } from '@/types/order';

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function groupOrdersByDate(orders: Order[]): OrdersGroupedByDate {
  const grouped: OrdersGroupedByDate = {};

  orders.forEach(order => {
    const date = new Date(order.fechaIngreso);
    const year = date.getFullYear();
    const month = date.getMonth();
    const week = getWeekNumber(date);
    const day = date.toISOString().split('T')[0];

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = {};
    if (!grouped[year][month][week]) grouped[year][month][week] = {};
    if (!grouped[year][month][week][day]) grouped[year][month][week][day] = [];

    grouped[year][month][week][day].push(order);
  });

  return grouped;
}

export function calculateSaldo(order: Order): number {
  return calcularSaldo(order);
}

export function calculateTotal(order: Order): number {
  return calcularMontoConIVA(order);
}

export function calculateDashboardStats(orders: Order[]): DashboardStats {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const countByStatus = (orderList: Order[], status: string) => 
    orderList.filter(o => o.estado === status).length;

  // Total counts across ALL orders (what the dashboard should show)
  const nuevaTotal = countByStatus(orders, 'Nueva');
  const procesoTotal = countByStatus(orders, 'En proceso');
  const terminadoTotal = countByStatus(orders, 'Terminado');

  // For percentage change: compare current month vs previous month
  const currentMonthOrders = orders.filter(o => new Date(o.fechaIngreso) >= currentMonthStart);
  const previousMonthOrders = orders.filter(o => {
    const date = new Date(o.fechaIngreso);
    return date >= previousMonthStart && date < currentMonthStart;
  });

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    nueva: {
      count: nuevaTotal,
      change: calculateChange(
        countByStatus(currentMonthOrders, 'Nueva'),
        countByStatus(previousMonthOrders, 'Nueva')
      )
    },
    enProceso: {
      count: procesoTotal,
      change: calculateChange(
        countByStatus(currentMonthOrders, 'En proceso'),
        countByStatus(previousMonthOrders, 'En proceso')
      )
    },
    terminado: {
      count: terminadoTotal,
      change: calculateChange(
        countByStatus(currentMonthOrders, 'Terminado'),
        countByStatus(previousMonthOrders, 'Terminado')
      )
    }
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

// generateOrderId is now async — see generateOrderIdFromDB in order-store.ts
// This is a fallback for offline/sync scenarios
export function generateOrderId(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `ORD-${yy}${mm}${dd}-${seq}`;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
