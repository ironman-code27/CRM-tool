import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type { Lead } from '../../../shared/types/Lead.js';
import type { PipelineStage } from '../../../shared/types/PipelineStage.js';

const LEADS_TABLE = 'Texkera-CRM-DataBase';

// ─── Supabase row type ──────────────────────────────────────────────────────
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

// ─── ID Mapping Helpers ─────────────────────────────────────────────────────
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

// ─── Row ↔ Lead mappers ─────────────────────────────────────────────────────
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
    services: (row.services as ('cyber' | 'cloud' | 'saas' | 'pmaas')[]) ?? [],
    notes: row.notes ?? '',
    channels: [],
    created: row.created_at ? row.created_at.slice(0, 10) : '',
  };
}

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

// Helper to fetch all leads from DB
async function fetchAllLeadsInternal(): Promise<Lead[]> {
  const { data, error } = await supabase.from(LEADS_TABLE).select('*');
  if (error) throw error;
  return ((data ?? []) as LeadRow[]).map(rowToLead);
}

// SSE Connections list
let clients: Response[] = [];

// Broadcast leads to all connected SSE clients
async function broadcastLeads() {
  try {
    const leads = await fetchAllLeadsInternal();
    const payload = JSON.stringify(leads);
    clients.forEach((client) => {
      client.write(`data: ${payload}\n\n`);
    });
  } catch (err) {
    console.error('[leadsController] broadcastLeads error:', err);
  }
}

// Subscribe to Supabase Postgres changes and broadcast on changes
supabase
  .channel('realtime-leads-backend')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: LEADS_TABLE,
    },
    () => {
      broadcastLeads();
    }
  )
  .subscribe();

// ─── Controller Actions ─────────────────────────────────────────────────────

export async function getLeads(req: Request, res: Response) {
  try {
    const leads = await fetchAllLeadsInternal();
    res.json({ success: true, data: leads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createLead(req: Request, res: Response) {
  try {
    const lead = req.body as Lead;
    const { error } = await supabase.from(LEADS_TABLE).insert(leadToRow(lead));
    if (error) throw error;
    res.json({ success: true });
    broadcastLeads();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateLead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const patch = req.body as Partial<Lead>;
    const rowPatch = patchToRowPatch(patch);
    if (Object.keys(rowPatch).length > 0) {
      const uuid = reactIdToUuid(id);
      const { error } = await supabase.from(LEADS_TABLE).update(rowPatch).eq('id', uuid);
      if (error) throw error;
    }
    res.json({ success: true });
    broadcastLeads();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteLead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const uuid = reactIdToUuid(id);
    const { error } = await supabase.from(LEADS_TABLE).delete().eq('id', uuid);
    if (error) throw error;
    res.json({ success: true });
    broadcastLeads();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function bulkInsertLeads(req: Request, res: Response) {
  try {
    const leads = req.body as Lead[];
    if (leads.length > 0) {
      const { error } = await supabase
        .from(LEADS_TABLE)
        .upsert(leads.map(leadToRow), { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    }
    res.json({ success: true });
    broadcastLeads();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export function subscribeLeads(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial data to the new client
  fetchAllLeadsInternal()
    .then((leads) => {
      res.write(`data: ${JSON.stringify(leads)}\n\n`);
    })
    .catch((err) => {
      console.error('[leadsController] initial subscribe load error:', err);
    });

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter((c) => c !== res);
  });
}
