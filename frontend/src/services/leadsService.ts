/**
 * leadsService.ts
 *
 * Dedicated Supabase persistence layer for the Leads feature.
 * Connects directly to Supabase from the client, bypassing the Node backend.
 */

import { supabase } from '../lib/supabase';
import type { Lead } from '../types/Lead';

const LEADS_TABLE = 'Texkera-CRM-DataBase' as const;

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── ID Mapping Helpers (React ID string ↔ UUID) ──────────────────────────

function reactIdToUuid(reactId: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(reactId)) {
    return reactId.toLowerCase();
  }
  let hex = '';
  for (let i = 0; i < reactId.length; i++) {
    hex += reactId.charCodeAt(i).toString(16).padStart(2, '0');
  }
  hex = hex.padEnd(32, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

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

// ─── Schema Mapping Helpers ──────────────────────────────────────────────────

function rowToLead(row: any): Lead {
  return {
    id: uuidToReactId(row.id),
    fname: row.first_name || '',
    lname: row.last_name || '',
    title: row.job_title || '',
    company: row.company || '',
    email: row.email || '',
    country: row.country || '',
    stage: (row.stage || 'new') as Lead['stage'],
    assignee: row.assignee || 'Unassigned',
    services: Array.isArray(row.services) ? row.services : [],
    notes: row.notes || '',
    channels: [],
    created: row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

function leadToRow(lead: Lead): any {
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
    services: lead.services,
    notes: lead.notes,
    created_at: new Date(lead.created).toISOString(),
  };
}

function patchToRowPatch(patch: Partial<Lead>): any {
  const rowPatch: any = {};
  if (patch.fname !== undefined) rowPatch.first_name = patch.fname;
  if (patch.lname !== undefined) rowPatch.last_name = patch.lname;
  if (patch.title !== undefined) rowPatch.job_title = patch.title;
  if (patch.company !== undefined) rowPatch.company = patch.company;
  if (patch.email !== undefined) rowPatch.email = patch.email;
  if (patch.country !== undefined) rowPatch.country = patch.country;
  if (patch.stage !== undefined) rowPatch.stage = patch.stage;
  if (patch.assignee !== undefined) rowPatch.assignee = patch.assignee;
  if (patch.services !== undefined) rowPatch.services = patch.services;
  if (patch.notes !== undefined) rowPatch.notes = patch.notes;
  if (patch.created !== undefined) rowPatch.created_at = new Date(patch.created).toISOString();
  return rowPatch;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<ServiceResult<Lead[]>> {
  try {
    const { data, error } = await supabase
      .from(LEADS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const leads = (data || []).map(rowToLead);
    return { success: true, data: leads };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] getLeads exception:', message);
    return { success: false, error: message };
  }
}

export async function createLead(lead: Lead): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from(LEADS_TABLE)
      .insert(leadToRow(lead));

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] createLead exception:', message);
    return { success: false, error: message };
  }
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<ServiceResult> {
  try {
    const rowPatch = patchToRowPatch(patch);
    if (Object.keys(rowPatch).length > 0) {
      const uuid = reactIdToUuid(id);
      const { error } = await supabase
        .from(LEADS_TABLE)
        .update(rowPatch)
        .eq('id', uuid);

      if (error) throw error;
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] updateLead exception:', message);
    return { success: false, error: message };
  }
}

export async function deleteLead(id: string): Promise<ServiceResult> {
  try {
    const uuid = reactIdToUuid(id);
    const { error } = await supabase
      .from(LEADS_TABLE)
      .delete()
      .eq('id', uuid);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] deleteLead exception:', message);
    return { success: false, error: message };
  }
}

export async function bulkInsertLeads(leads: Lead[]): Promise<ServiceResult> {
  if (leads.length === 0) return { success: true };

  try {
    const { error } = await supabase
      .from(LEADS_TABLE)
      .upsert(leads.map(leadToRow), { onConflict: 'id', ignoreDuplicates: true });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[leadsService] bulkInsertLeads exception:', message);
    return { success: false, error: message };
  }
}

// ─── Realtime Subscription ──────────────────────────────────────────────────

export type LeadChangeCallback = (leads: Lead[]) => void;

export function subscribeToLeads(callback: LeadChangeCallback): () => void {
  const channel = supabase
    .channel('realtime-leads-frontend')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: LEADS_TABLE,
      },
      async () => {
        const res = await getLeads();
        if (res.success && res.data) {
          callback(res.data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
