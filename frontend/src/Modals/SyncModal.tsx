import React, { useState } from 'react';
import { createBin } from '../services/jsonbin';
import { useCRM } from '../context/CRMContext';

interface SyncModalProps {
  binId: string | null;
  binKey: string | null;
  setBinId: (id: string | null) => void;
  setBinKey: (key: string | null) => void;
  reloadFromCloud: () => Promise<boolean>;
  setSyncState: any;
  leads: any[];
  tasks: any[];
  activity: any[];
  team: any[];
  close: () => void;
  toast: any;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  binId,
  binKey,
  setBinId,
  setBinKey,
  reloadFromCloud,
  setSyncState,
  leads,
  tasks,
  activity,
  team,
  close,
  toast,
}) => {
  const [masterKey, setMasterKey] = useState(binKey || '');
  const [binIdInput, setBinIdInput] = useState(binId || '');
  const { logManualHistory } = useCRM();

  const handleSave = async () => {
    const key = masterKey.trim();
    const bid = binIdInput.trim();

    if (!key) {
      window.alert('Please enter your JSONBin Master Key.');
      return;
    }

    setBinKey(key);
    localStorage.setItem('tx-bin-key', key);
    logManualHistory('Settings Changed', 'System', '', 'Sync Settings', 'Sync configuration (JSONBin ID and Key) was updated.');

    if (bid) {
      setBinId(bid);
      localStorage.setItem('tx-bin-id', bid);
      setSyncState('loading');

      setTimeout(async () => {
        const loaded = await reloadFromCloud();
        if (loaded) {
          toast('Synced with shared CRM!');
        } else {
          toast('Could not load — check ID and key.');
        }
      }, 100);
    } else {
      setSyncState('saving');
      const data = { leads, tasks, activity, team };
      const createdId = await createBin(key, data);
      if (createdId) {
        setBinId(createdId);
        localStorage.setItem('tx-bin-id', createdId);
        setSyncState('saved');
        toast('Sync bin created! Share the Bin ID with your team.');
      } else {
        setSyncState('error');
        toast('Could not create bin — check your Master Key.');
      }
    }
    close();
  };

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Set up shared team sync
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px', lineHeight: 1.6 }}>
          Uses <strong>JSONBin.io</strong> (free) as a shared database — all team members see the same data in real time.<br /><br />
          <strong>Step 1:</strong> Go to <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" style={{ color: '#1B3FAB' }}>jsonbin.io</a> → sign up free → copy your <em>Master Key</em>.<br />
          <strong>First person:</strong> Paste the key and click Save — a Bin ID is created. Share it with the team.<br />
          <strong>Other team members:</strong> Paste the key AND the Bin ID you were given.
        </p>
        <div className="form-row full" style={{ marginBottom: '12px' }}>
          <div className="form-group">
            <label>JSONBin Master Key</label>
            <input
              type="password"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              placeholder="$2a$10$…"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="form-row full" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label>Bin ID — leave blank to create a new shared bin</label>
            <input
              type="text"
              value={binIdInput}
              onChange={(e) => setBinIdInput(e.target.value)}
              placeholder="e.g. 686abc123def456…"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {binId && (
          <div
            id="sync-bin-display-row"
            style={{
              background: 'var(--green-bg)',
              border: '1px solid var(--green)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: 'var(--green)',
            }}
          >
            <strong>Your Bin ID — share this with team members:</strong>
            <br />
            <span id="sync-bin-display" style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
              {binId}
            </span>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save &amp; sync</button>
        </div>
      </div>
    </div>
  );
};
export default SyncModal;
