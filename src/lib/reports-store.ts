'use client';

import { createClient } from './supabase';

export interface DesignerStat {
  name: string;
  assigned: number;
  completed: number;
  totalWorkMs: number;
  avgWorkMs: number | null;
}

export interface MonthlyReportData {
  period: string;
  year: number;
  month: number;
  generatedAt: string;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersByType: Record<string, number>;
  designerStats: DesignerStat[];
  topDesignerByVolume: string | null;
  topDesignerBySpeed: string | null;
  avgCompletedPerDesigner: number;
}

export interface MonthlyReport {
  id: string;
  period: string;
  year: number;
  month: number;
  data: MonthlyReportData;
  generatedAt: Date;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export async function loadReports(): Promise<MonthlyReport[]> {
  const { data, error } = await createClient()
    .from('monthly_reports')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    console.error('[reports] loadReports:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    period: row.period,
    year: row.year,
    month: row.month,
    data: row.data as MonthlyReportData,
    generatedAt: new Date(row.generated_at),
  }));
}
