import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DESIGNERS = ['Arte 1', 'Arte 2', 'Arte 3', 'Arte 4'];

function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

function isLastDayOfMonth(year: number, month: number): boolean {
  const today = new Date();
  const lastDay = new Date(year, month, 0).getDate();
  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === lastDay;
}

async function buildReport(year: number, month: number) {
  const supabase = getServiceClient();
  const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const next = new Date(year, month, 1);
  const endStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, estado, tipo_orden, disenado_por')
    .gte('fecha_ingreso', startStr)
    .lt('fecha_ingreso', endStr);

  if (ordersError) throw new Error(ordersError.message);

  const ordersList = orders || [];

  const ordersByStatus: Record<string, number> = {};
  const ordersByType: Record<string, number> = {};
  const designerAssigned: Record<string, number> = {};

  for (const o of ordersList) {
    const status = o.estado || 'Nueva';
    ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    const tipo = o.tipo_orden || 'Rotulacion';
    ordersByType[tipo] = (ordersByType[tipo] || 0) + 1;
    if (o.disenado_por) {
      designerAssigned[o.disenado_por] = (designerAssigned[o.disenado_por] || 0) + 1;
    }
  }

  const orderIds = ordersList.map(o => o.id);
  let sessions: any[] = [];
  if (orderIds.length > 0) {
    const { data: sd } = await supabase
      .from('design_sessions')
      .select('designer_id, status, total_elapsed_ms')
      .in('order_id', orderIds);
    sessions = sd || [];
  }

  const designerStats = DESIGNERS.map(name => {
    const assigned = designerAssigned[name] || 0;
    const mine = sessions.filter(s => s.designer_id === name);
    const completed = mine.filter(s => s.status === 'completed').length;
    const totalWorkMs = mine
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (Number(s.total_elapsed_ms) || 0), 0);
    return {
      name,
      assigned,
      completed,
      totalWorkMs,
      avgWorkMs: completed > 0 ? Math.round(totalWorkMs / completed) : null,
    };
  });

  const topDesignerByVolume =
    [...designerStats].filter(d => d.assigned > 0).sort((a, b) => b.assigned - a.assigned)[0]?.name ?? null;

  const topDesignerBySpeed =
    [...designerStats]
      .filter(d => d.avgWorkMs !== null && d.completed > 0)
      .sort((a, b) => (a.avgWorkMs ?? 0) - (b.avgWorkMs ?? 0))[0]?.name ?? null;

  const withWork = designerStats.filter(d => d.assigned > 0);
  const totalCompleted = designerStats.reduce((s, d) => s + d.completed, 0);
  const avgCompletedPerDesigner = withWork.length > 0 ? Math.round(totalCompleted / withWork.length) : 0;

  const period = `${year}-${String(month).padStart(2, '0')}`;

  return {
    period,
    year,
    month,
    generatedAt: new Date().toISOString(),
    totalOrders: ordersList.length,
    ordersByStatus,
    ordersByType,
    designerStats,
    topDesignerByVolume,
    topDesignerBySpeed,
    avgCompletedPerDesigner,
  };
}

// GET — called by Vercel Cron (Authorization: Bearer <CRON_SECRET>)
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (!isLastDayOfMonth(year, month)) {
    return NextResponse.json({ skip: true, message: 'Not last day of month' });
  }

  try {
    const data = await buildReport(year, month);
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('monthly_reports')
      .upsert({ period: data.period, year, month, data, generated_at: new Date().toISOString() }, { onConflict: 'period' });
    if (error) throw new Error(error.message);

    // Delete reports older than 5 years
    await supabase.from('monthly_reports').delete().lt('year', year - 5);

    return NextResponse.json({ success: true, period: data.period, totalOrders: data.totalOrders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — manual trigger from admin UI
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const now = new Date();
  const year = Number(body.year) || now.getFullYear();
  const month = Number(body.month) || (now.getMonth() + 1);

  try {
    const data = await buildReport(year, month);
    const supabase = getServiceClient();
    const { error } = await supabase
      .from('monthly_reports')
      .upsert({ period: data.period, year, month, data, generated_at: new Date().toISOString() }, { onConflict: 'period' });
    if (error) throw new Error(error.message);

    await supabase.from('monthly_reports').delete().lt('year', year - 5);

    return NextResponse.json({ success: true, period: data.period, totalOrders: data.totalOrders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
