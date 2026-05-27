'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Undo2, Clock } from 'lucide-react';
import { Order, StationHistoryEntry } from '@/types/order';
import { useAuth } from '@/contexts/auth-context';
import {
  STATIONS,
  STATION_COLORS,
  Station,
  canMoveFromStation,
  daysInStation,
  suggestedNextStations,
} from '@/lib/stations';
import { loadStationHistory } from '@/lib/order-store';
import { formatDate } from '@/lib/order-utils';

interface StationControlProps {
  order: Order;
  onMove: (orderId: string, newStation: Station) => Promise<void>;
}

export function StationControl({ order, onMove }: StationControlProps) {
  const { user, userRole } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [history, setHistory] = useState<StationHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [moving, setMoving] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const current = order.estacionActual ?? null;
  const previous = order.estacionAnterior ?? null;
  const days = daysInStation(order.estacionDesde);
  const stalled = days >= 3;

  const canMove = canMoveFromStation(userRole, current);
  const suggested = suggestedNextStations(current);
  const suggestedSet = new Set<Station>(suggested);
  const restStations = STATIONS.filter(
    (s) => !suggestedSet.has(s) && s !== current,
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    loadStationHistory(order.id)
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order.id, order.estacionActual]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePick = async (station: Station) => {
    if (!canMove || moving) return;
    setPickerOpen(false);
    setMoving(true);
    try {
      await onMove(order.id, station);
    } finally {
      setMoving(false);
    }
  };

  const handleReturn = async () => {
    if (!previous || !canMove || moving) return;
    setMoving(true);
    try {
      await onMove(order.id, previous);
    } finally {
      setMoving(false);
    }
  };

  const currentColors = current
    ? STATION_COLORS[current]
    : { bg: 'bg-[#1E293B]', text: 'text-[#94A3B8]', dot: 'bg-[#64748B]' };

  return (
    <div className="rounded-[12px] border border-border bg-[#0F172A]/60 p-4 space-y-4">
      {/* Header: where it is now */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#F97316]" />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Actualmente en
            </div>
            <div
              className={`inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-[10px] font-bold text-base shadow-md ${currentColors.bg} ${currentColors.text}`}
            >
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${currentColors.dot}`} />
              {current ?? 'Sin estación'}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
              {previous && (
                <span className="text-muted-foreground">
                  Viene de <span className="font-medium text-foreground">{previous}</span>
                </span>
              )}
              {order.estacionDesde && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    stalled ? 'text-[#F97316] font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {days === 0 ? 'hoy' : days === 1 ? 'hace 1 día' : `hace ${days} días`}
                  {stalled && ' (atrasada)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {canMove && (
          <div className="flex items-center gap-2">
            {previous && (
              <button
                onClick={handleReturn}
                disabled={moving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-white hover:border-[#F97316]/50 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                title={`Devolver a ${previous}`}
              >
                <Undo2 className="w-3.5 h-3.5" />
                Devolver
              </button>
            )}
            <div ref={pickerRef} className="relative">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                disabled={moving}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#F97316] text-white hover:bg-[#EA580C] text-sm font-semibold transition-all duration-200 shadow-md disabled:opacity-50"
              >
                Pasar a estación
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    pickerOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {pickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-card border border-border rounded-[10px] shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                  {suggested.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-[#0F172A]">
                        Siguiente sugerido
                      </div>
                      {suggested.map((s) => (
                        <StationOption key={s} station={s} onClick={() => handlePick(s)} />
                      ))}
                    </>
                  )}
                  {restStations.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-[#0F172A] border-t border-border">
                        Otras estaciones
                      </div>
                      {restStations.map((s) => (
                        <StationOption key={s} station={s} onClick={() => handlePick(s)} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="border-t border-border pt-3">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Historial
        </div>
        {loadingHistory ? (
          <div className="text-xs text-muted-foreground">Cargando…</div>
        ) : history.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sin movimientos registrados.</div>
        ) : (
          <ol className="space-y-2">
            {history.map((entry, idx) => {
              const colors = STATION_COLORS[entry.estacionHasta];
              const isLast = idx === history.length - 1;
              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors?.dot ?? 'bg-[#64748B]'}`} />
                    {!isLast && <span className="w-px flex-1 bg-border min-h-[20px] mt-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="text-sm">
                      {entry.estacionDesde ? (
                        <>
                          <span className="text-muted-foreground">{entry.estacionDesde}</span>
                          <span className="mx-1.5 text-muted-foreground">→</span>
                          <span className="font-semibold">{entry.estacionHasta}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Inicio:</span>{' '}
                          <span className="font-semibold">{entry.estacionHasta}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(entry.movidaEn)}
                      {entry.movidaPorName && <> · {entry.movidaPorName}</>}
                    </div>
                    {entry.notas && (
                      <div className="text-xs text-muted-foreground italic mt-1">
                        “{entry.notas}”
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!canMove && current && (
        <div className="text-xs text-muted-foreground italic">
          Solo usuarios asignados a esta estación pueden moverla.
        </div>
      )}
    </div>
  );
}

function StationOption({ station, onClick }: { station: Station; onClick: () => void }) {
  const colors = STATION_COLORS[station];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium hover:bg-accent transition-all duration-150"
    >
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors.dot}`} />
      {station}
    </button>
  );
}
