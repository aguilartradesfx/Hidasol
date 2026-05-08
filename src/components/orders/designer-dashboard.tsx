'use client';

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/order';
import {
  DesignSession,
  loadSessionsForDesigner,
  subscribeToDesignerSessions,
  startTimer,
  pauseTimer,
  completeTimer,
  getCurrentElapsedMs,
  formatElapsed,
  formatTimeAgo,
} from '@/lib/design-sessions-store';
import { formatDate } from '@/lib/order-utils';
import {
  Play, Pause, CheckCircle2, Clock, ListChecks, Timer,
  AlertCircle, Package, User, Inbox, CheckCheck,
} from 'lucide-react';

interface DesignerDashboardProps {
  myOrders: Order[];
  user: { id: string; name: string; role: string };
  onOrderClick: (order: Order) => void;
}

type Tab = 'sin_iniciar' | 'en_curso' | 'terminados';

// ── Big digital clock (shown at top when a timer is running or paused) ────────
function BigClock({
  session,
  order,
  onPause,
  onStart,
  onComplete,
  loading,
}: {
  session: DesignSession;
  order: Order;
  onPause: () => void;
  onStart: () => void;
  onComplete: () => void;
  loading: boolean;
}) {
  const [elapsed, setElapsed] = useState(getCurrentElapsedMs(session));
  const isRunning = session.status === 'running';

  useEffect(() => {
    setElapsed(getCurrentElapsedMs(session));
    if (!isRunning) return;
    const id = setInterval(() => setElapsed(getCurrentElapsedMs(session)), 1000);
    return () => clearInterval(id);
  }, [session, isRunning]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className={`rounded-[16px] border p-6 space-y-4 transition-all duration-300 ${
      isRunning
        ? 'border-green-500/40 bg-gradient-to-br from-green-500/10 to-transparent'
        : 'border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-transparent'
    }`}>
      {/* Order info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {isRunning
              ? <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              : <span className="w-2 h-2 rounded-full bg-yellow-500" />}
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isRunning ? 'Timer activo' : 'En pausa'}
            </span>
          </div>
          <p className="font-mono text-sm font-bold text-[#F97316]">{order.id}</p>
          <p className="text-sm font-medium text-foreground">{order.cliente}</p>
        </div>
        {order.fechaLimite && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5" />
            Límite: {formatDate(order.fechaLimite)}
          </div>
        )}
      </div>

      {/* Big digital time */}
      <div className="text-center">
        <span className={`text-5xl lg:text-7xl font-mono font-bold tabular-nums tracking-tight ${
          isRunning ? 'text-green-400' : 'text-yellow-400'
        }`}>
          {timeStr}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {isRunning ? (
          <button
            onClick={onPause}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-all disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-green-500 text-white font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Reanudar
          </button>
        )}
        <button
          onClick={onComplete}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-[#34D399]/50 text-[#34D399] font-semibold hover:bg-[#34D399]/10 transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          Terminar
        </button>
      </div>
    </div>
  );
}

// ── All done state ────────────────────────────────────────────────────────────
function AllDoneCard() {
  return (
    <div className="rounded-[16px] border border-[#34D399]/40 bg-[#34D399]/10 p-8 text-center space-y-3">
      <CheckCheck className="w-12 h-12 text-[#34D399] mx-auto" />
      <p className="text-xl font-bold font-['Bricolage_Grotesque'] text-[#34D399]">¡Todo listo!</p>
      <p className="text-sm text-muted-foreground">No hay trabajos pendientes por iniciar o en curso</p>
    </div>
  );
}

// ── Small live timer (for card list) ─────────────────────────────────────────
function LiveTimer({ session }: { session: DesignSession | undefined }) {
  const [elapsed, setElapsed] = useState(session ? getCurrentElapsedMs(session) : 0);

  useEffect(() => {
    if (!session || session.status !== 'running') {
      setElapsed(session ? session.totalElapsedMs : 0);
      return;
    }
    setElapsed(getCurrentElapsedMs(session));
    const id = setInterval(() => setElapsed(getCurrentElapsedMs(session)), 1000);
    return () => clearInterval(id);
  }, [session]);

  return (
    <span className="font-mono text-sm font-bold tabular-nums">{formatElapsed(elapsed)}</span>
  );
}

// ── Order card for Sin Iniciar list ──────────────────────────────────────────
function PendingOrderCard({
  order,
  onStart,
  onClick,
  loading,
}: {
  order: Order;
  onStart: () => void;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-card p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold text-[#F97316]">{order.id}</span>
          {order.tipoOrden && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">{order.tipoOrden}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{order.cliente}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Llegó {formatTimeAgo(new Date(order.fechaIngreso))}
        </div>
      </div>
      <button
        onClick={onStart}
        disabled={loading}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
      >
        <Play className="w-3.5 h-3.5" />
        Iniciar
      </button>
    </div>
  );
}

// ── Order card for En Curso list (non-active timers) ─────────────────────────
function InProgressCard({
  order,
  session,
  onStart,
  onPause,
  onComplete,
  onClick,
  loading,
}: {
  order: Order;
  session: DesignSession;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onClick: () => void;
  loading: boolean;
}) {
  const isRunning = session.status === 'running';

  return (
    <div className={`rounded-[12px] border p-4 space-y-3 ${
      isRunning ? 'border-green-500/40 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#F97316]">{order.id}</span>
            {isRunning
              ? <span className="flex items-center gap-1 text-xs text-green-500 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Corriendo</span>
              : <span className="text-xs text-yellow-500 font-medium">Pausado</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{order.cliente}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Timer className="w-3.5 h-3.5 text-muted-foreground" />
          <LiveTimer session={session} />
        </div>
      </div>
      <div className="flex gap-2">
        {isRunning ? (
          <button onClick={onPause} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] bg-yellow-500 text-white text-xs font-semibold hover:bg-yellow-600 transition-all disabled:opacity-50">
            <Pause className="w-3.5 h-3.5" />Pausar
          </button>
        ) : (
          <button onClick={onStart} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-all disabled:opacity-50">
            <Play className="w-3.5 h-3.5" />Reanudar
          </button>
        )}
        <button onClick={onComplete} disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] border border-[#34D399]/40 text-[#34D399] text-xs font-semibold hover:bg-[#34D399]/10 transition-all disabled:opacity-50">
          <CheckCircle2 className="w-3.5 h-3.5" />Terminar
        </button>
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────
export function DesignerDashboard({ myOrders, user, onOrderClick }: DesignerDashboardProps) {
  const [tab, setTab] = useState<Tab>('sin_iniciar');
  const [sessions, setSessions] = useState<DesignSession[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    const data = await loadSessionsForDesigner(user.name);
    setSessions(data);
  }, [user.name]);

  useEffect(() => {
    fetchSessions();
    const unsub = subscribeToDesignerSessions(user.name, setSessions);
    return unsub;
  }, [fetchSessions, user.name]);

  const getSession = (orderId: string) => sessions.find(s => s.orderId === orderId);

  // Classify orders by session state
  const sinIniciarOrders = myOrders.filter(o => {
    const s = getSession(o.id);
    return !s || s.status === 'idle';
  });

  const enCursoOrders = myOrders.filter(o => {
    const s = getSession(o.id);
    return s?.status === 'running' || s?.status === 'paused';
  });

  const completedOrders = myOrders.filter(o => getSession(o.id)?.status === 'completed');

  // The active (running) session for the big clock
  const activeSession = sessions.find(s => s.status === 'running') || sessions.find(s => s.status === 'paused');
  const activeOrder = activeSession ? myOrders.find(o => o.id === activeSession.orderId) : null;

  const allDone = sinIniciarOrders.length === 0 && enCursoOrders.length === 0 && myOrders.length > 0;

  const handleStart = async (orderId: string) => {
    setLoadingAction(orderId);
    await startTimer(orderId, user.name);
    await fetchSessions();
    setLoadingAction(null);
    setTab('en_curso');
  };

  const handlePause = async (orderId: string) => {
    setLoadingAction(orderId);
    await pauseTimer(orderId, user.name);
    await fetchSessions();
    setLoadingAction(null);
  };

  const handleComplete = async (orderId: string) => {
    setLoadingAction(orderId);
    await completeTimer(orderId, user.name);
    await fetchSessions();
    setLoadingAction(null);
  };

  const TABS: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: 'sin_iniciar', label: 'Sin Iniciar', icon: Inbox, count: sinIniciarOrders.length },
    { id: 'en_curso', label: 'En Curso', icon: Timer, count: enCursoOrders.length },
    { id: 'terminados', label: 'Terminados', icon: CheckCircle2, count: completedOrders.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-5xl font-bold font-['Bricolage_Grotesque'] text-foreground mb-1">
          Hola, <span className="text-[#F97316]">{user.name}</span>
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          {myOrders.length} órdenes asignadas
          {activeSession?.status === 'running' && (
            <span className="ml-2 inline-flex items-center gap-1 text-green-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Timer activo
            </span>
          )}
        </p>
      </div>

      {/* Big clock — shown whenever there's an active or paused session */}
      {activeSession && activeOrder && (
        <BigClock
          key={activeSession.id}
          session={activeSession}
          order={activeOrder}
          onStart={() => handleStart(activeOrder.id)}
          onPause={() => handlePause(activeOrder.id)}
          onComplete={() => handleComplete(activeOrder.id)}
          loading={loadingAction === activeOrder.id}
        />
      )}

      {/* All done banner */}
      {allDone && <AllDoneCard />}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[12px] border border-[#60A5FA]/20 bg-[#60A5FA]/10 p-4 text-center">
          <div className="text-2xl font-bold font-['Bricolage_Grotesque']">{sinIniciarOrders.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Sin iniciar</div>
        </div>
        <div className="rounded-[12px] border border-green-500/20 bg-green-500/10 p-4 text-center">
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-green-500">{enCursoOrders.length}</div>
          <div className="text-xs text-muted-foreground mt-1">En curso</div>
        </div>
        <div className="rounded-[12px] border border-[#34D399]/20 bg-[#34D399]/10 p-4 text-center">
          <div className="text-2xl font-bold font-['Bricolage_Grotesque'] text-[#34D399]">{completedOrders.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Terminados</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[10px] bg-muted/50 border border-border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-200 ${
                tab === t.id ? 'bg-[#F97316] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-white/20' : 'bg-muted text-muted-foreground'
              }`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Sin Iniciar */}
      {tab === 'sin_iniciar' && (
        <div className="space-y-3">
          {sinIniciarOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin órdenes nuevas</p>
              <p className="text-sm mt-1">Todas las órdenes ya fueron iniciadas</p>
            </div>
          ) : (
            sinIniciarOrders.map(order => (
              <PendingOrderCard
                key={order.id}
                order={order}
                onStart={() => handleStart(order.id)}
                onClick={() => onOrderClick(order)}
                loading={loadingAction === order.id}
              />
            ))
          )}
        </div>
      )}

      {/* En Curso */}
      {tab === 'en_curso' && (
        <div className="space-y-3">
          {enCursoOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Timer className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Ningún trabajo en curso</p>
              <p className="text-sm mt-1">Inicia un trabajo desde la pestaña &quot;Sin Iniciar&quot;</p>
            </div>
          ) : (
            enCursoOrders.map(order => {
              const s = getSession(order.id)!;
              return (
                <InProgressCard
                  key={order.id}
                  order={order}
                  session={s}
                  onStart={() => handleStart(order.id)}
                  onPause={() => handlePause(order.id)}
                  onComplete={() => handleComplete(order.id)}
                  onClick={() => onOrderClick(order)}
                  loading={loadingAction === order.id}
                />
              );
            })
          )}
        </div>
      )}

      {/* Terminados */}
      {tab === 'terminados' && (
        <div className="space-y-3">
          {completedOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aún no hay trabajos completados</p>
            </div>
          ) : (
            completedOrders.map(order => {
              const s = getSession(order.id);
              return (
                <div
                  key={order.id}
                  onClick={() => onOrderClick(order)}
                  className="rounded-[12px] border border-[#34D399]/30 bg-[#34D399]/5 p-4 cursor-pointer hover:border-[#34D399]/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#F97316]">{order.id}</span>
                        <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                      </div>
                      <div className="text-sm font-medium mt-0.5">{order.cliente}</div>
                      <div className="text-xs text-muted-foreground">{order.productoNombre || order.trabajo}</div>
                    </div>
                    {s && (
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground">Tiempo total</div>
                        <div className="font-mono text-sm font-bold text-[#34D399]">{formatElapsed(s.totalElapsedMs)}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(order.fechaIngreso)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
