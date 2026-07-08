import React, { useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import * as csvService from '../services/csv';
import { bulkInsertLeads } from '../services/leadsService';

const viewTitles: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'Welcome back'],
  pipeline: ['Pipeline', 'Drag leads through your sales stages'],
  leads: ['All leads', 'Search, filter and manage every contact'],
  activity: ['Activity log', 'Every touchpoint across all channels'],
  tasks: ['Tasks', 'Follow-ups and to-dos for the team'],
  team: ['Team members', 'Manage who has access to the CRM'],
  detail: ['Lead detail', ''],
};

export const Topbar: React.FC = () => {
  const {
    currentView,
    syncState,
    leads,
    activity,
    triggerSave,
    setActiveModal,
    setEditLeadId,
    setUploadResultsHtml,
    toast,
  } = useCRM();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set titles based on view
  const [title, subtitle] = viewTitles[currentView] || ['', ''];

  // Sync state presentation details
  const syncPresentation = {
    saved: ['● Synced', 'var(--green)'],
    saving: ['↻ Saving…', 'var(--amber)'],
    error: ['✕ Sync error', 'var(--red)'],
    offline: ['○ Local only', 'var(--text3)'],
    loading: ['↻ Loading…', 'var(--amber)'],
  }[syncState] || ['○ Local', 'var(--text3)'];

  // Handle Export Action
  const handleExport = () => {
    csvService.exportCSV(leads, activity);
    toast('CSV downloaded');
  };

  // Build Results UI HTML (matches the original UI markup exactly)
  const buildUploadResultsHtml = (res: csvService.ImportResult, isExcel: boolean) => {
    const dupeLabel = isExcel ? 'Duplicates skipped' : 'Duplicates removed';
    const skipLabel = isExcel ? 'Duplicates skipped' : 'Duplicates skipped';

    let html = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
        <div style="background:#EAFAF1;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#16A34A">${res.added}</div>
          <div style="font-size:12px;color:#4A5568">Leads added</div>
        </div>
        <div style="background:#FEF5EC;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#E8650A">${res.dupes}</div>
          <div style="font-size:12px;color:#4A5568">${dupeLabel}</div>
        </div>
        <div style="background:#F4F6F9;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#4A5568">${res.skipped}</div>
          <div style="font-size:12px;color:#4A5568">Rows skipped</div>
        </div>
      </div>
    `;

    if (res.addedNames.length) {
      html += `
        <div style="margin-bottom:12px">
          <div style="font-size:12px;font-weight:600;color:#16A34A;margin-bottom:6px">Added (${res.addedNames.length})</div>
          ${res.addedNames.map((n) => `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid #E2E6EE">${n}</div>`).join('')}
        </div>
      `;
    }

    if (res.dupeNames.length) {
      html += `
        <div>
          <div style="font-size:12px;font-weight:600;color:#E8650A;margin-bottom:6px">${skipLabel} (${res.dupeNames.length})</div>
          ${res.dupeNames.map((n) => `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid #E2E6EE">${n}</div>`).join('')}
        </div>
      `;
    }

    return html;
  };

  // Handle File Input Change
  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      try {
        const result = await csvService.handleXLSXUpload(file, leads);
        triggerSave({ leads: result.updatedLeads });
        setUploadResultsHtml(buildUploadResultsHtml(result, true));
        setActiveModal('upload');

        // Sync only genuinely new leads to Supabase (non-blocking)
        if (result.added > 0) {
          const existingIds = new Set(leads.map((l) => l.id));
          const newLeads = result.updatedLeads.filter((l) => !existingIds.has(l.id));
          bulkInsertLeads(newLeads).then((syncResult) => {
            if (!syncResult.success) {
              toast('Leads imported locally — cloud sync failed');
              console.warn('[Topbar] bulkInsertLeads (xlsx) failed:', syncResult.error);
            }
          });
        }
      } catch (err) {
        toast('Could not parse file.');
        console.error(err);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const result = csvService.handleCSVText(text, leads);
          triggerSave({ leads: result.updatedLeads });
          setUploadResultsHtml(buildUploadResultsHtml(result, false));
          setActiveModal('upload');

          // Sync only genuinely new leads to Supabase (non-blocking)
          if (result.added > 0) {
            const existingIds = new Set(leads.map((l) => l.id));
            const newLeads = result.updatedLeads.filter((l) => !existingIds.has(l.id));
            bulkInsertLeads(newLeads).then((syncResult) => {
              if (!syncResult.success) {
                toast('Leads imported locally — cloud sync failed');
                console.warn('[Topbar] bulkInsertLeads (csv) failed:', syncResult.error);
              }
            });
          }
        } catch (err) {
          toast('CSV parse error');
          console.error(err);
        }
      };
      reader.readAsText(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAddLead = () => {
    setEditLeadId(null);
    setActiveModal('lead');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title" id="topbar-title">
            {title}
          </div>
          <div className="topbar-subtitle" id="topbar-sub">
            {subtitle}
          </div>
        </div>
      </div>
      <div className="topbar-actions">
        <span
          id="sync-indicator"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap',
            color: syncPresentation[1],
          }}
          onClick={() => setActiveModal('sync')}
          title="Set up shared team sync"
        >
          {syncPresentation[0]}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload leads
        </button>
        <input
          type="file"
          id="csv-upload"
          ref={fileInputRef}
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleUploadChange}
        />
        <button className="btn btn-ghost btn-sm" onClick={handleExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
        <button className="btn btn-primary btn-sm" onClick={openAddLead}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add lead
        </button>
      </div>
    </div>
  );
};
export default Topbar;
