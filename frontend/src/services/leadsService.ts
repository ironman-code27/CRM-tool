/**
 * leadsService.ts
 *
 * Dedicated REST API persistence layer for the Leads feature.
 * Connects to the TypeScript Express backend instead of Supabase directly.
 */

import type { Lead } from '../types/Lead';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/leads';

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all leads from the Backend.
 */
export async function getLeads(): Promise<ServiceResult<Lead[]>> {
  try {
    const res = await fetch(`${API_BASE}/`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] getLeads exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Insert a single new lead into backend.
 */
export async function createLead(lead: Lead): Promise<ServiceResult> {
  try {
    const res = await fetch(`${API_BASE}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] createLead exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Update specific fields of an existing lead in backend.
 */
export async function updateLead(
  id: string,
  patch: Partial<Lead>
): Promise<ServiceResult> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] updateLead exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Delete a lead from backend by its id.
 */
export async function deleteLead(id: string): Promise<ServiceResult> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] deleteLead exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Upsert multiple leads into backend.
 */
export async function bulkInsertLeads(leads: Lead[]): Promise<ServiceResult> {
  if (leads.length === 0) return { success: true };

  try {
    const res = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] bulkInsertLeads exception:', message);
    return { success: false, error: message };
  }
}

// ─── Realtime SSE subscription ──────────────────────────────────────────────

export type LeadChangeCallback = (leads: Lead[]) => void;

export function subscribeToLeads(callback: LeadChangeCallback): () => void {
  const eventSource = new EventSource(`${API_BASE}/subscribe`);

  eventSource.onmessage = (event) => {
    try {
      const latestLeads = JSON.parse(event.data);
      if (Array.isArray(latestLeads)) {
        callback(latestLeads);
      }
    } catch (err) {
      console.error('[leadsService] SSE parse error:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('[leadsService] SSE connection error:', err);
  };

  return () => {
    eventSource.close();
  };
}
