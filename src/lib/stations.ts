import type { UserRole } from '@/contexts/auth-context';

export const STATIONS = [
  'Recepción',
  'Diseño',
  'Corte e impresión',
  'Grabado Láser',
  'Litografía',
  'Taller',
  'Encuadernación',
  'Acabados',
  'Bodega',
] as const;

export type Station = (typeof STATIONS)[number];

export function isStation(value: unknown): value is Station {
  return typeof value === 'string' && (STATIONS as readonly string[]).includes(value);
}

// Visual color per station (pastel-ish, fits existing dark palette).
export const STATION_COLORS: Record<Station, { bg: string; text: string; dot: string }> = {
  'Recepción':         { bg: 'bg-[#FCD34D]', text: 'text-[#92400E]', dot: 'bg-[#FCD34D]' },
  'Diseño':            { bg: 'bg-[#A78BFA]', text: 'text-[#3B0764]', dot: 'bg-[#A78BFA]' },
  'Corte e impresión': { bg: 'bg-[#60A5FA]', text: 'text-[#1E3A8A]', dot: 'bg-[#60A5FA]' },
  'Grabado Láser':     { bg: 'bg-[#F472B6]', text: 'text-[#831843]', dot: 'bg-[#F472B6]' },
  'Litografía':        { bg: 'bg-[#FB923C]', text: 'text-[#7C2D12]', dot: 'bg-[#FB923C]' },
  'Taller':            { bg: 'bg-[#94A3B8]', text: 'text-[#0F172A]', dot: 'bg-[#94A3B8]' },
  'Encuadernación':    { bg: 'bg-[#FBBF24]', text: 'text-[#78350F]', dot: 'bg-[#FBBF24]' },
  'Acabados':          { bg: 'bg-[#22D3EE]', text: 'text-[#155E75]', dot: 'bg-[#22D3EE]' },
  'Bodega':            { bg: 'bg-[#34D399]', text: 'text-[#065F46]', dot: 'bg-[#34D399]' },
};

// Which stations each role can MOVE orders out of.
// Anyone can SEE all stations in the timeline; this only limits the
// "Pasar a estación" / "Devolver" actions.
const ROLE_STATIONS: Record<UserRole, Station[] | '*'> = {
  admin: '*',
  ventas: '*',
  diseno: ['Diseño'],
  corte: ['Corte e impresión'],
  laser: ['Grabado Láser'],
  litografia: ['Litografía'],
  taller: ['Taller'],
  encuadernacion: ['Encuadernación'],
  acabados: ['Acabados'],
  bodega: ['Bodega'],
};

export function canMoveFromStation(role: UserRole | null, station: Station | null | undefined): boolean {
  if (!role || !station) return false;
  const allowed = ROLE_STATIONS[role];
  if (allowed === '*') return true;
  return allowed.includes(station);
}

export function stationsVisibleToRole(role: UserRole | null): Station[] {
  if (!role) return [];
  const allowed = ROLE_STATIONS[role];
  if (allowed === '*') return [...STATIONS];
  return allowed;
}

// The single station a station-only role manages. Returns null for
// admin / ventas (they see everything) and for diseno (handled by
// the dedicated DesignerDashboard, not a station view).
export function primaryStationForRole(role: UserRole | null): Station | null {
  if (!role) return null;
  const allowed = ROLE_STATIONS[role];
  if (allowed === '*') return null;
  if (allowed.length === 1) return allowed[0];
  return null;
}

// True for roles that should see ONLY their station's queue (no sidebar,
// no global stats, no search). Designers have their own specialised view.
export function isStationOnlyRole(role: UserRole | null): boolean {
  if (!role) return false;
  if (role === 'admin' || role === 'ventas' || role === 'diseno') return false;
  return primaryStationForRole(role) !== null;
}

// Suggested "next" stations from a given one. Order matters: the first
// items show at the top of the dropdown. The full list of stations is
// always available below the suggestions so the user can pick anything.
const NEXT_HINTS: Record<Station, Station[]> = {
  'Recepción':         ['Diseño'],
  'Diseño':            ['Corte e impresión', 'Grabado Láser', 'Litografía'],
  'Corte e impresión': ['Taller', 'Acabados', 'Grabado Láser'],
  'Grabado Láser':     ['Taller', 'Acabados'],
  'Litografía':        ['Encuadernación', 'Acabados'],
  'Taller':            ['Acabados', 'Encuadernación'],
  'Encuadernación':    ['Acabados', 'Bodega'],
  'Acabados':          ['Bodega'],
  'Bodega':            [],
};

export function suggestedNextStations(current: Station | null | undefined): Station[] {
  if (!current) return [...STATIONS];
  return NEXT_HINTS[current] ?? [];
}

export function daysInStation(since: Date | null | undefined): number {
  if (!since) return 0;
  const ms = Date.now() - new Date(since).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
