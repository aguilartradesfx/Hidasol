"use client";

import { createClient } from "./supabase";

export type SessionStatus = "idle" | "running" | "paused" | "completed";

export interface DesignSession {
  id: string;
  orderId: string;
  designerId: string;
  totalElapsedMs: number;
  timerStart: Date | null;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

function rowToSession(row: any): DesignSession {
  return {
    id: row.id,
    orderId: row.order_id,
    designerId: row.designer_id,
    totalElapsedMs: Number(row.total_elapsed_ms) || 0,
    timerStart: row.timer_start ? new Date(row.timer_start) : null,
    status: row.status as SessionStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function getSupabase() {
  return createClient();
}

export function getCurrentElapsedMs(session: DesignSession): number {
  if (session.status === "running" && session.timerStart) {
    return session.totalElapsedMs + (Date.now() - session.timerStart.getTime());
  }
  return session.totalElapsedMs;
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
  if (hours > 0) return `hace ${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
  if (minutes > 0) return `hace ${minutes} min`;
  return "hace un momento";
}

// ── Load sessions for a designer ────────────────────────────────────────────

export async function loadSessionsForDesigner(designerId: string): Promise<DesignSession[]> {
  const { data, error } = await getSupabase()
    .from("design_sessions")
    .select("*")
    .eq("designer_id", designerId);
  if (error) {
    console.error("[design-sessions] loadSessionsForDesigner:", error);
    return [];
  }
  return (data || []).map(rowToSession);
}

export async function getOrCreateSession(
  orderId: string,
  designerId: string
): Promise<DesignSession | null> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("design_sessions")
    .select("*")
    .eq("order_id", orderId)
    .eq("designer_id", designerId)
    .maybeSingle();

  if (fetchError) {
    console.error("[design-sessions] getOrCreateSession fetch:", fetchError);
    return null;
  }

  if (existing) return rowToSession(existing);

  const { data: created, error: createError } = await supabase
    .from("design_sessions")
    .insert({ order_id: orderId, designer_id: designerId, status: "idle", total_elapsed_ms: 0 })
    .select()
    .single();

  if (createError) {
    console.error("[design-sessions] getOrCreateSession create:", createError);
    return null;
  }

  return rowToSession(created);
}

// ── Timer actions ────────────────────────────────────────────────────────────

export async function startTimer(
  orderId: string,
  designerId: string
): Promise<DesignSession | null> {
  const session = await getOrCreateSession(orderId, designerId);
  if (!session) return null;
  if (session.status === "running") return session;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("design_sessions")
    .update({
      status: "running",
      timer_start: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("designer_id", designerId)
    .select()
    .single();

  if (error) {
    console.error("[design-sessions] startTimer:", error);
    return null;
  }
  return rowToSession(data);
}

export async function pauseTimer(
  orderId: string,
  designerId: string
): Promise<DesignSession | null> {
  const session = await getOrCreateSession(orderId, designerId);
  if (!session || session.status !== "running" || !session.timerStart) return session;

  const elapsed = Date.now() - session.timerStart.getTime();
  const newTotal = session.totalElapsedMs + elapsed;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("design_sessions")
    .update({
      status: "paused",
      timer_start: null,
      total_elapsed_ms: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("designer_id", designerId)
    .select()
    .single();

  if (error) {
    console.error("[design-sessions] pauseTimer:", error);
    return null;
  }
  return rowToSession(data);
}

export async function completeTimer(
  orderId: string,
  designerId: string
): Promise<DesignSession | null> {
  const session = await getOrCreateSession(orderId, designerId);
  if (!session) return null;

  let newTotal = session.totalElapsedMs;
  if (session.status === "running" && session.timerStart) {
    newTotal += Date.now() - session.timerStart.getTime();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("design_sessions")
    .update({
      status: "completed",
      timer_start: null,
      total_elapsed_ms: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("designer_id", designerId)
    .select()
    .single();

  if (error) {
    console.error("[design-sessions] completeTimer:", error);
    return null;
  }
  return rowToSession(data);
}

// ── Realtime subscription ────────────────────────────────────────────────────

export function subscribeToDesignerSessions(
  designerId: string,
  callback: (sessions: DesignSession[]) => void
) {
  const supabase = getSupabase();
  supabase.getChannels().forEach(ch => {
    if (ch.topic === "realtime:public:design_sessions") supabase.removeChannel(ch);
  });

  const channel = supabase
    .channel("realtime:public:design_sessions")
    .on("postgres_changes", { event: "*", schema: "public", table: "design_sessions", filter: `designer_id=eq.${designerId}` }, async () => {
      const sessions = await loadSessionsForDesigner(designerId);
      callback(sessions);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
