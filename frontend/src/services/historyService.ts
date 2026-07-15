/**
 * historyService.ts
 *
 * Dedicated Supabase persistence layer for the CRM Activity History (Audit Log).
 * Connects directly to Supabase with automatic local storage and jsonbin fallback.
 */

import { supabase } from '../lib/supabase';
import type { HistoryEntry } from '../types/HistoryEntry';

const HISTORY_TABLE = 'activity_history' as const;
const LS_KEY = 'tx-history-v2';

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  isFallback?: boolean;
}

// Global flag to track if we've determined that the table doesn't exist in Supabase
let useLocalFallback = false;

// Helper to get local history
function getLocalHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save local history
function saveLocalHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('[historyService] Failed to save local history:', err);
  }
}

export async function createHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'created_at'>): Promise<ServiceResult> {
  const newEntry: HistoryEntry = {
    ...entry,
    id: entry.entity_id ? `${entry.module}-${entry.entity_id}-${Date.now()}` : `sys-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  // 1. Always save locally first (ensures offline/fallback durability)
  const localList = getLocalHistory();
  saveLocalHistory([newEntry, ...localList]);

  // 2. If already using fallback, skip Supabase
  if (useLocalFallback) {
    return { success: true, isFallback: true };
  }

  try {
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .insert({
        action: newEntry.action,
        module: newEntry.module,
        entity_id: newEntry.entity_id,
        entity_name: newEntry.entity_name,
        old_value: newEntry.old_value,
        new_value: newEntry.new_value,
        description: newEntry.description,
        performed_by: newEntry.performed_by,
        metadata: newEntry.metadata || {},
      });

    if (error) {
      // If table doesn't exist (PGRST205) or relation doesn't exist (42P01)
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('[historyService] activity_history table not found in Supabase. Using local storage fallback.');
        useLocalFallback = true;
        return { success: true, isFallback: true };
      }
      throw error;
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[historyService] createHistoryEntry exception:', message);
    return { success: false, error: message };
  }
}

export async function getHistory(): Promise<ServiceResult<HistoryEntry[]>> {
  if (useLocalFallback) {
    return { success: true, data: getLocalHistory(), isFallback: true };
  }

  try {
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('[historyService] activity_history table not found in Supabase. Falling back to local storage.');
        useLocalFallback = true;
        return { success: true, data: getLocalHistory(), isFallback: true };
      }
      throw error;
    }

    const entries: HistoryEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      action: row.action || '',
      module: row.module || '',
      entity_id: row.entity_id || '',
      entity_name: row.entity_name || '',
      old_value: row.old_value || '',
      new_value: row.new_value || '',
      description: row.description || '',
      performed_by: row.performed_by || '',
      created_at: row.created_at || '',
      metadata: row.metadata || {},
    }));

    // Sync remote with local entries to keep local state up to date
    saveLocalHistory(entries);

    return { success: true, data: entries };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[historyService] getHistory exception:', message);
    // Graceful fallback on error
    return { success: true, data: getLocalHistory(), error: message, isFallback: true };
  }
}
