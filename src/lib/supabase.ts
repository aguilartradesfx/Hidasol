'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Custom storage that falls back to memory if localStorage is unavailable
class HybridStorage implements Storage {
  private memory: Map<string, string> = new Map();
  private useLocalStorage: boolean;

  constructor() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      this.useLocalStorage = true;
      console.log('[Supabase] Using localStorage for session persistence');
    } catch (e) {
      this.useLocalStorage = false;
      console.warn('[Supabase] localStorage unavailable, using in-memory storage:', e);
    }
  }

  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('[Storage] localStorage.setItem failed, falling back to memory:', e);
        this.memory.set(key, value);
      }
    } else {
      this.memory.set(key, value);
    }
  }

  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return this.memory.get(key) || null;
      }
    }
    return this.memory.get(key) || null;
  }

  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('[Storage] localStorage.removeItem failed:', e);
      }
    }
    this.memory.delete(key);
  }

  clear(): void {
    if (this.useLocalStorage) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('[Storage] localStorage.clear failed:', e);
      }
    }
    this.memory.clear();
  }

  key(index: number): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.key(index);
      } catch (e) {
        const keys = Array.from(this.memory.keys());
        return keys[index] || null;
      }
    }
    const keys = Array.from(this.memory.keys());
    return keys[index] || null;
  }

  get length(): number {
    if (this.useLocalStorage) {
      try {
        return localStorage.length;
      } catch (e) {
        return this.memory.size;
      }
    }
    return this.memory.size;
  }
}

let hybridStorage: HybridStorage | null = null;

function getStorage(): HybridStorage {
  if (!hybridStorage) {
    hybridStorage = new HybridStorage();
  }
  return hybridStorage;
}

/**
 * Singleton Supabase browser client.
 * Uses @supabase/supabase-js directly (not @supabase/ssr) so that
 * the session is stored in localStorage and persists across page reloads.
 * Falls back to in-memory storage if localStorage is unavailable.
 */
export function createClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: 'hidasol-auth',
        storage: getStorage(),
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  );

  return supabaseInstance;
}
