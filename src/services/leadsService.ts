/**
 * leadsService.ts
 *
 * Dedicated Supabase persistence layer for the Leads feature.
 *
 * Design contract
 * ───────────────
 * • triggerSave() in CRMContext is NOT touched — it remains the source of
 *   truth for React state and localStorage.
 * • Every function here returns a ServiceResult so callers can decide
 *   whether to show a non-blocking "cloud sync failed" toast. None of them
 *   throw — all errors are caught internally and logged to the console.
 * • Callers should fire these functions without awaiting them at the UI
 *   level (fire-and-forget via .then()) so the UI is never blocked.
 * • All schema mapping logic is isolated in this file. The React application
 *   uses the Lead model, and the database uses the Tekxera-CRM-DataBase table columns.
 */

import { supabase } from './supabase';
import type { Lead } from '../types/Lead';
import type { PipelineStage } from '../types/PipelineStage';

// ─── Table configuration ────────────────────────────────────────────────────

/** The Supabase table that stores lead rows. */
const LEADS_TABLE = 'Texkera-CRM-DataBase' as const;

// ─── Supabase row type ──────────────────────────────────────────────────────

/**
 * Represents one row in the Supabase leads table.
 * Column names match the database schema:
 * - id (uuid)
 * - first_name (text)
 * - last_name (text)
 * - job_title (text)
 * - company (text)
 * - email (text)
 * - country (text)
 * - stage (text)
 * - assignee (text)
 * - services (text array)
 * - notes (text)
 * - created_at (timestamptz)
 */
export interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company: string;
  email: string;
  country: string;
  stage: string;
  assignee: string;
  services: string[];
  notes: string;
  created_at: string;
}

// ─── Generic result type ────────────────────────────────────────────────────

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── ID Mapping Helpers (React ID string ↔ UUID) ──────────────────────────

/**
 * Deterministically converts a React lead ID (e.g. 'l1783500954000' or 'l1')
 * into a valid UUID string.
 */
function reactIdToUuid(reactId: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(reactId)) {
    return reactId.toLowerCase();
  }

  // Convert each character of the reactId to hex
  let hex = '';
  for (let i = 0; i < reactId.length; i++) {
    hex += reactId.charCodeAt(i).toString(16).padStart(2, '0');
  }
  // Pad with '0' to reach 32 characters
  hex = hex.padEnd(32, '0');
  // Format as xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Deterministically converts a UUID string back into the React lead ID.
 */
function uuidToReactId(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const codeStr = hex.slice(i, i + 2);
    if (codeStr === '00') break;
    str += String.fromCharCode(parseInt(codeStr, 16));
  }
  return str;
}

// ─── Row ↔ Lead mappers ─────────────────────────────────────────────────────

/** Converts a raw Supabase row into the Lead model used by the React app. */
function rowToLead(row: LeadRow): Lead {
  return {
    id: uuidToReactId(row.id),
    fname: row.first_name ?? '',
    lname: row.last_name ?? '',
    title: row.job_title ?? '',
    company: row.company ?? '',
    email: row.email ?? '',
    country: row.country ?? '',
    stage: (row.stage as PipelineStage) ?? 'new',
    assignee: row.assignee ?? '',
    services: (row.services as ('cyber' | 'cloud' | 'saas')[]) ?? [],
    notes: row.notes ?? '',
    channels: [], // Database schema does not have channels column
    created: row.created_at ? row.created_at.slice(0, 10) : '',
  };
}

/** Converts the React Lead model into the Supabase row shape. */
function leadToRow(lead: Lead): LeadRow {
  return {
    id: reactIdToUuid(lead.id),
    first_name: lead.fname,
    last_name: lead.lname,
    job_title: lead.title,
    company: lead.company,
    email: lead.email,
    country: lead.country,
    stage: lead.stage,
    assignee: lead.assignee,
    services: lead.services || [],
    notes: lead.notes,
    created_at: lead.created ? new Date(lead.created).toISOString() : new Date().toISOString(),
  };
}

/** Converts partial Lead updates into database column names. */
function patchToRowPatch(patch: Partial<Lead>): Partial<LeadRow> {
  const row: Partial<LeadRow> = {};
  if (patch.fname !== undefined) row.first_name = patch.fname;
  if (patch.lname !== undefined) row.last_name = patch.lname;
  if (patch.title !== undefined) row.job_title = patch.title;
  if (patch.company !== undefined) row.company = patch.company;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.country !== undefined) row.country = patch.country;
  if (patch.stage !== undefined) row.stage = patch.stage;
  if (patch.assignee !== undefined) row.assignee = patch.assignee;
  if (patch.services !== undefined) row.services = patch.services;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.created !== undefined) {
    row.created_at = patch.created ? new Date(patch.created).toISOString() : new Date().toISOString();
  }
  return row;
}

// ─── CRUD operations ────────────────────────────────────────────────────────

/**
 * Fetch all leads from Supabase.
 */
export async function getLeads(): Promise<ServiceResult<Lead[]>> {
  try {
    const { data, error } = await supabase
      .from(LEADS_TABLE)
      .select('*');

    if (error) {
      console.error('[leadsService] getLeads error:', error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: ((data ?? []) as LeadRow[]).map(rowToLead),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] getLeads exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Insert a single new lead into Supabase.
 */
export async function createLead(lead: Lead): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from(LEADS_TABLE)
      .insert(leadToRow(lead));

    if (error) {
      console.error('[leadsService] createLead error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] createLead exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Update specific fields of an existing lead in Supabase.
 */
export async function updateLead(
  id: string,
  patch: Partial<Lead>
): Promise<ServiceResult> {
  try {
    const rowPatch = patchToRowPatch(patch);

    if (Object.keys(rowPatch).length === 0) {
      return { success: true };
    }

    const uuid = reactIdToUuid(id);
    const { error } = await supabase
      .from(LEADS_TABLE)
      .update(rowPatch)
      .eq('id', uuid);

    if (error) {
      console.error('[leadsService] updateLead error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] updateLead exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Delete a lead from Supabase by its id.
 */
export async function deleteLead(id: string): Promise<ServiceResult> {
  try {
    const uuid = reactIdToUuid(id);
    const { error } = await supabase
      .from(LEADS_TABLE)
      .delete()
      .eq('id', uuid);

    if (error) {
      console.error('[leadsService] deleteLead error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] deleteLead exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Upsert multiple leads into Supabase.
 */
export async function bulkInsertLeads(leads: Lead[]): Promise<ServiceResult> {
  if (leads.length === 0) return { success: true };

  try {
    const { error } = await supabase
      .from(LEADS_TABLE)
      .upsert(leads.map(leadToRow), { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      console.error('[leadsService] bulkInsertLeads error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] bulkInsertLeads exception:', message);
    return { success: false, error: message };
  }
}

// ─── Realtime-ready subscription stub ──────────────────────────────────────

export type LeadChangeCallback = (leads: Lead[]) => void;

export function subscribeToLeads(_callback: LeadChangeCallback): () => void {
  return () => {
    /* no-op unsubscribe */
  };
}
