import * as XLSX from 'xlsx';
import type { Lead } from '../types/Lead';
import type { Activity } from '../types/Activity';
import { fullName } from '../utils/helpers';
import { channelLabel } from '../utils/helpers';

export function exportCSV(leads: Lead[], activity: Activity[]) {
  const headers = ['Name', 'Title', 'Company', 'Email', 'Country', 'Stage', 'Assigned To', 'Services', 'Channels Used', 'Notes', 'Added'];
  const rows = leads.map((l) => {
    const chs = [...new Set(activity.filter((a) => a.leadId === l.id).map((a) => a.channel))]
      .map(channelLabel)
      .join('; ');
    return [
      fullName(l),
      l.title,
      l.company,
      l.email,
      l.country,
      l.stage,
      l.assignee || '',
      (l.services || []).join('; '),
      chs,
      l.notes || '',
      l.created || '',
    ];
  });
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TekXera_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export interface ImportResult {
  updatedLeads: Lead[];
  added: number;
  dupes: number;
  skipped: number;
  addedNames: string[];
  dupeNames: string[];
}

export function processImportRows(rows: Record<string, any>[], currentLeads: Lead[]): ImportResult {
  let added = 0;
  let dupes = 0;
  let skipped = 0;
  const addedNames: string[] = [];
  const dupeNames: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const nextLeads = [...currentLeads];

  rows.forEach((row, i) => {
    const r: Record<string, string> = {};
    Object.keys(row).forEach((k) => (r[k.toLowerCase().trim()] = String(row[k] || '').trim()));

    let fname = r['first name'] || r['firstname'] || r['fname'] || '';
    let lname = r['last name'] || r['lastname'] || r['lname'] || '';

    if (!fname && !lname) {
      const n = (r['name'] || r['full name'] || '').trim();
      if (n) {
        const p = n.split(' ');
        fname = p[0];
        lname = p.slice(1).join(' ');
      }
    }

    if (!fname && !lname) {
      skipped++;
      return;
    }

    const email = (r['email'] || r['email address'] || '').toLowerCase();
    const company = r['company'] || r['company name'] || r['organisation'] || '';

    const isDupe = nextLeads.some((l) => {
      if (email && l.email && l.email.toLowerCase() === email) return true;
      if (fullName(l).toLowerCase() === `${fname} ${lname}`.toLowerCase() && l.company.toLowerCase() === company.toLowerCase()) return true;
      return false;
    });

    if (isDupe) {
      dupes++;
      dupeNames.push(fname + ' ' + lname + (company ? ' (' + company + ')' : ''));
      return;
    }

    const svcRaw = (r['services'] || r['service'] || '').toLowerCase();
    const svcs: ('cyber' | 'cloud' | 'saas' | 'pmaas')[] = [];
    if (svcRaw.includes('cyber')) svcs.push('cyber');
    if (svcRaw.includes('cloud') || svcRaw.includes('it ')) svcs.push('cloud');
    if (svcRaw.includes('saas') || svcRaw.includes('software')) svcs.push('saas');
    if (svcRaw.includes('pmaas') || svcRaw.includes('pm ')) svcs.push('pmaas');

    nextLeads.push({
      id: 'l' + Date.now() + 'x' + i,
      fname,
      lname,
      title: r['title'] || r['job title'] || r['position'] || '',
      company,
      email: r['email'] || '',
      country: r['country'] || r['location'] || '',
      stage: 'new',
      assignee: '',
      services: svcs,
      notes: r['notes'] || r['note'] || '',
      channels: [],
      created: today,
    });
    added++;
    addedNames.push(fname + ' ' + lname + (company ? ' (' + company + ')' : ''));
  });

  return {
    updatedLeads: nextLeads,
    added,
    dupes,
    skipped,
    addedNames,
    dupeNames,
  };
}

export function handleCSVText(text: string, currentLeads: Lead[]): ImportResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV appears empty.');
  }
  const rawHeaders = parseCSVRow(lines[0]).map((h) => h.toLowerCase().replace(/"/g, '').trim());
  const col = (...keys: string[]) => rawHeaders.findIndex((h) => keys.some((k) => h.includes(k)));

  const idx = {
    fname: col('first'),
    lname: col('last'),
    name: col('name', 'contact'),
    title: col('title', 'job', 'position'),
    company: col('company', 'organ'),
    email: col('email'),
    country: col('country'),
    services: col('service'),
    notes: col('note', 'why'),
  };

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (!cols.length) continue;

    const rowObj: Record<string, any> = {};
    if (idx.fname >= 0) rowObj['first name'] = cols[idx.fname];
    if (idx.lname >= 0) rowObj['last name'] = cols[idx.lname];
    if (idx.name >= 0) rowObj['name'] = cols[idx.name];
    if (idx.title >= 0) rowObj['title'] = cols[idx.title];
    if (idx.company >= 0) rowObj['company'] = cols[idx.company];
    if (idx.email >= 0) rowObj['email'] = cols[idx.email];
    if (idx.country >= 0) rowObj['country'] = cols[idx.country];
    if (idx.services >= 0) rowObj['services'] = cols[idx.services];
    if (idx.notes >= 0) rowObj['notes'] = cols[idx.notes];

    rows.push(rowObj);
  }

  return processImportRows(rows, currentLeads);
}

export function handleXLSXUpload(file: File, currentLeads: Lead[]): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (!evt.target?.result) {
          reject(new Error('Empty file'));
          return;
        }
        const wb = XLSX.read(new Uint8Array(evt.target.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
        const result = processImportRows(rows, currentLeads);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
