'use client';
import { createClient } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

function db(client?: SupabaseClient): SupabaseClient {
  return client ?? (createClient() as SupabaseClient);
}

export async function getBotConfig(client?: SupabaseClient) {
  const { data, error } = await db(client).from('bot_config').select('bot_enabled, system_prompt').eq('id', 1).maybeSingle();
  if (error) throw new Error(`getBotConfig: ${error.message}`);
  return { botEnabled: !!data?.bot_enabled, systemPrompt: data?.system_prompt ?? '' };
}

export async function setBotEnabled(enabled: boolean, updatedBy: string, client?: SupabaseClient) {
  const { error } = await db(client).from('bot_config').update({ bot_enabled: enabled, updated_by: updatedBy, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw new Error(`setBotEnabled: ${error.message}`);
}

export async function setSystemPrompt(prompt: string, updatedBy: string, client?: SupabaseClient) {
  if (!prompt || !prompt.trim()) throw new Error('El prompt no puede estar vacío');
  const { error } = await db(client).from('bot_config').update({ system_prompt: prompt, updated_by: updatedBy, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) throw new Error(`setSystemPrompt: ${error.message}`);
}

export async function listContactStates(client?: SupabaseClient) {
  const { data, error } = await db(client).from('sessions').select('contact_id, name, estado_bot, updated_at').order('updated_at', { ascending: false }).limit(50);
  if (error) throw new Error(`listContactStates: ${error.message}`);
  return data ?? [];
}

export async function setContactBot(contactId: string, on: boolean, client?: SupabaseClient) {
  const { error } = await db(client).from('sessions').update({ estado_bot: on ? 'idle' : 'off' }).eq('contact_id', contactId);
  if (error) throw new Error(`setContactBot: ${error.message}`);
}

export async function listProductos(client?: SupabaseClient) {
  const { data, error } = await db(client).from('productos').select('*').order('categoria', { ascending: true });
  if (error) throw new Error(`listProductos: ${error.message}`);
  return data ?? [];
}

export async function upsertProducto(p: any, client?: SupabaseClient) {
  const { error } = await db(client).from('productos').upsert(p);
  if (error) throw new Error(`upsertProducto: ${error.message}`);
}

export async function deleteProducto(id: string, client?: SupabaseClient) {
  const { error } = await db(client).from('productos').delete().eq('id', id);
  if (error) throw new Error(`deleteProducto: ${error.message}`);
}

export async function listKnowledge(client?: SupabaseClient) {
  const { data, error } = await db(client).from('knowledge_chunks').select('id, contenido, categoria').order('categoria', { ascending: true });
  if (error) throw new Error(`listKnowledge: ${error.message}`);
  return data ?? [];
}

export async function deleteKnowledge(id: string, client?: SupabaseClient) {
  const { error } = await db(client).from('knowledge_chunks').delete().eq('id', id);
  if (error) throw new Error(`deleteKnowledge: ${error.message}`);
}
