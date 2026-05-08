'use client';

import { useState, useEffect } from 'react';
import { FileBarChart2, Download, RefreshCw, Trophy, Zap, CheckCircle, Clock } from 'lucide-react';
import { loadReports, MonthlyReport, MONTH_NAMES } from '@/lib/reports-store';

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-secondary/50 border border-border rounded-[12px] p-4 flex items-start gap-3">
      <div className="p-2 rounded-[8px] bg-primary/10 shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold w-6 text-right">{value}</span>
    </div>
  );
}

function downloadReport(report: MonthlyReport) {
  const d = report.data;
  const monthLabel = `${MONTH_NAMES[d.month - 1]} ${d.year}`;
  const lines: string[] = [
    `REPORTE MENSUAL — HIDASOL`,
    `Período: ${monthLabel}`,
    `Generado: ${new Date(d.generatedAt).toLocaleString('es-CR')}`,
    ``,
    `══════════════════════════════════════`,
    `RESUMEN GENERAL`,
    `══════════════════════════════════════`,
    `Total de órdenes:           ${d.totalOrders}`,
    ``,
    `── Por estado ──`,
    ...Object.entries(d.ordersByStatus).map(([k, v]) => `  ${k.padEnd(20)} ${v}`),
    ``,
    `── Por tipo ──`,
    ...Object.entries(d.ordersByType).map(([k, v]) => `  ${k.padEnd(20)} ${v}`),
    ``,
    `══════════════════════════════════════`,
    `MÉTRICAS DE DISEÑADORES`,
    `══════════════════════════════════════`,
    `Diseñador más activo:       ${d.topDesignerByVolume ?? '—'}`,
    `Diseñador más rápido:       ${d.topDesignerBySpeed ?? '—'}`,
    `Promedio completados/diseñ: ${d.avgCompletedPerDesigner}`,
    ``,
    `── Detalle por diseñador ──`,
    ...d.designerStats.map(s =>
      `  ${s.name.padEnd(10)}  Asignados: ${String(s.assigned).padStart(3)}  Terminados: ${String(s.completed).padStart(3)}  Tiempo prom: ${s.avgWorkMs !== null ? formatMs(s.avgWorkMs) : '—'}`
    ),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hidasol-reporte-${report.period}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function triggerGenerate(year: number, month: number): Promise<boolean> {
  const res = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month }),
  });
  return res.ok;
}

export function ReportsView() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [selected, setSelected] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    const data = await loadReports();
    setReports(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    const now = new Date();
    const ok = await triggerGenerate(now.getFullYear(), now.getMonth() + 1);
    if (ok) await fetchReports();
    setGenerating(false);
  };

  const d = selected?.data;
  const maxDesigner = d ? Math.max(...d.designerStats.map(s => s.assigned), 1) : 1;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">
      {/* ── Left panel: list of reports ── */}
      <div className="lg:w-56 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reportes guardados</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            title="Generar reporte del mes actual"
            className="p-1.5 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <FileBarChart2 className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">Sin reportes aún</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              Generar primero
            </button>
          </div>
        ) : (
          reports.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-3 py-2.5 rounded-[10px] transition-all duration-150 ${
                selected?.id === r.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              }`}
            >
              <p className="text-sm font-semibold">{MONTH_NAMES[r.month - 1]} {r.year}</p>
              <p className={`text-xs ${selected?.id === r.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {r.data.totalOrders} órdenes
              </p>
            </button>
          ))
        )}
      </div>

      {/* ── Right panel: report detail ── */}
      <div className="flex-1 min-w-0">
        {!d ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <FileBarChart2 className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Selecciona un reporte para ver los detalles</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold font-['Bricolage_Grotesque']">
                  {MONTH_NAMES[d.month - 1]} <span className="text-primary">{d.year}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generado el {new Date(d.generatedAt).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => downloadReport(selected!)}
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-secondary border border-border text-sm font-medium hover:border-primary/50 transition-all"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={FileBarChart2} label="Total órdenes" value={String(d.totalOrders)} />
              <StatCard
                icon={Trophy}
                label="Más activo"
                value={d.topDesignerByVolume ?? '—'}
                sub={d.topDesignerByVolume ? `${d.designerStats.find(s => s.name === d.topDesignerByVolume)?.assigned ?? 0} asignadas` : undefined}
              />
              <StatCard
                icon={Zap}
                label="Más rápido"
                value={d.topDesignerBySpeed ?? '—'}
                sub={d.topDesignerBySpeed
                  ? formatMs(d.designerStats.find(s => s.name === d.topDesignerBySpeed)?.avgWorkMs ?? 0) + ' prom.'
                  : undefined}
              />
              <StatCard
                icon={CheckCircle}
                label="Prom. terminados"
                value={`${d.avgCompletedPerDesigner} / diseñador`}
              />
            </div>

            {/* Designer breakdown */}
            <div className="bg-card border border-border rounded-[12px] p-5">
              <h3 className="text-sm font-semibold mb-4">Órdenes por diseñador</h3>
              <div className="space-y-3">
                {d.designerStats.map(s => (
                  <div key={s.name} className="space-y-1">
                    <BarRow label={s.name} value={s.assigned} max={maxDesigner} color="bg-primary" />
                    <div className="flex gap-4 pl-24 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {s.completed} terminadas
                      </span>
                      {s.avgWorkMs !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatMs(s.avgWorkMs)} prom.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orders by status + type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-[12px] p-5">
                <h3 className="text-sm font-semibold mb-4">Por estado</h3>
                <div className="space-y-2.5">
                  {Object.entries(d.ordersByStatus).map(([k, v]) => (
                    <BarRow key={k} label={k} value={v} max={d.totalOrders} color="bg-blue-500" />
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-[12px] p-5">
                <h3 className="text-sm font-semibold mb-4">Por tipo</h3>
                <div className="space-y-2.5">
                  {Object.entries(d.ordersByType).map(([k, v]) => (
                    <BarRow key={k} label={k} value={v} max={d.totalOrders} color="bg-orange-500" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
