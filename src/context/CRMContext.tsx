import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Lead } from '../types/Lead';
import type { Task } from '../types/Task';
import type { Activity } from '../types/Activity';
import type { TeamMember } from '../types/TeamMember';
import { SEED_TEAM, SEED_LEADS } from '../constants/seedData';
import * as jsonbin from '../services/jsonbin';

interface CRMContextType {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activity: Activity[];
  setActivity: React.Dispatch<React.SetStateAction<Activity[]>>;
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  currentView: string;
  setCurrentView: (view: string) => void;
  currentDetailId: string | null;
  setCurrentDetailId: (id: string | null) => void;
  activeMemberFilter: string;
  setActiveMemberFilter: (filter: string) => void;
  currentPipelineView: 'all' | 'team';
  setCurrentPipelineView: (view: 'all' | 'team') => void;
  openCommentLeadId: string | null;
  setOpenCommentLeadId: (id: string | null) => void;
  detailCommentSentiment: 'positive' | 'neutral' | 'negative';
  setDetailCommentSentiment: (sentiment: 'positive' | 'neutral' | 'negative') => void;
  pipelineCommentSentiment: 'positive' | 'neutral' | 'negative';
  setPipelineCommentSentiment: (sentiment: 'positive' | 'neutral' | 'negative') => void;
  binId: string | null;
  setBinId: (id: string | null) => void;
  binKey: string | null;
  setBinKey: (key: string | null) => void;
  syncState: 'saved' | 'saving' | 'error' | 'offline' | 'loading';
  setSyncState: (state: 'saved' | 'saving' | 'error' | 'offline' | 'loading') => void;
  toastMsg: string;
  showToast: boolean;
  toast: (msg: string) => void;
  triggerSave: (updates?: { leads?: Lead[]; tasks?: Task[]; activity?: Activity[]; team?: TeamMember[] }) => void;
  reloadFromCloud: () => Promise<boolean>;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  editLeadId: string | null;
  setEditLeadId: (id: string | null) => void;
  preselectedLeadId: string | null;
  setPreselectedLeadId: (id: string | null) => void;
  uploadResultsHtml: string;
  setUploadResultsHtml: (html: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const LS = {
  leads: 'tx-leads-v2',
  tasks: 'tx-tasks-v2',
  activity: 'tx-activity-v2',
  team: 'tx-team-v2',
  binId: 'tx-bin-id',
  binKey: 'tx-bin-key',
};

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial local states
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const stored = localStorage.getItem(LS.leads);
      return stored ? JSON.parse(stored) : SEED_LEADS;
    } catch {
      return SEED_LEADS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(LS.tasks);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [activity, setActivity] = useState<Activity[]>(() => {
    try {
      const stored = localStorage.getItem(LS.activity);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const stored = localStorage.getItem(LS.team);
      return stored ? JSON.parse(stored) : SEED_TEAM;
    } catch {
      return SEED_TEAM;
    }
  });

  const [binId, setBinIdState] = useState<string | null>(() => localStorage.getItem(LS.binId));
  const [binKey, setBinKeyState] = useState<string | null>(() => localStorage.getItem(LS.binKey));

  // View States
  const [currentView, setCurrentViewState] = useState<string>('dashboard');
  const [currentDetailId, setCurrentDetailId] = useState<string | null>(null);
  const [activeMemberFilter, setActiveMemberFilter] = useState<string>('all');
  const [currentPipelineView, setCurrentPipelineView] = useState<'all' | 'team'>('all');
  const [openCommentLeadId, setOpenCommentLeadId] = useState<string | null>(null);
  const [detailCommentSentiment, setDetailCommentSentiment] = useState<'positive' | 'neutral' | 'negative'>('positive');
  const [pipelineCommentSentiment, setPipelineCommentSentiment] = useState<'positive' | 'neutral' | 'negative'>('positive');

  const [syncState, setSyncState] = useState<'saved' | 'saving' | 'error' | 'offline' | 'loading'>('offline');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [preselectedLeadId, setPreselectedLeadId] = useState<string | null>(null);
  const [uploadResultsHtml, setUploadResultsHtml] = useState<string>('');

  const syncTimerRef = useRef<number | null>(null);

  // Loaders/Setters wrappers for storage
  const setBinId = (id: string | null) => {
    setBinIdState(id);
    if (id) localStorage.setItem(LS.binId, id);
    else localStorage.removeItem(LS.binId);
  };

  const setBinKey = (key: string | null) => {
    setBinKeyState(key);
    if (key) localStorage.setItem(LS.binKey, key);
    else localStorage.removeItem(LS.binKey);
  };

  // Toast function
  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2200);
  };

  // Switch view title/sub title updating logic (matches showView)
  const setCurrentView = (view: string) => {
    setCurrentViewState(view);
    // Reset view specific filters/focus if returning
    if (view === 'pipeline') {
      setOpenCommentLeadId(null);
    }
  };

  // Trigger Local and Cloud Save
  const triggerSave = (updates?: { leads?: Lead[]; tasks?: Task[]; activity?: Activity[]; team?: TeamMember[] }) => {
    // Write local storage immediately
    let nextLeads = leads;
    let nextTasks = tasks;
    let nextActivity = activity;
    let nextTeam = team;

    if (updates) {
      if (updates.leads) {
        setLeads(updates.leads);
        localStorage.setItem(LS.leads, JSON.stringify(updates.leads));
        nextLeads = updates.leads;
      }
      if (updates.tasks) {
        setTasks(updates.tasks);
        localStorage.setItem(LS.tasks, JSON.stringify(updates.tasks));
        nextTasks = updates.tasks;
      }
      if (updates.activity) {
        setActivity(updates.activity);
        localStorage.setItem(LS.activity, JSON.stringify(updates.activity));
        nextActivity = updates.activity;
      }
      if (updates.team) {
        setTeam(updates.team);
        localStorage.setItem(LS.team, JSON.stringify(updates.team));
        nextTeam = updates.team;
      }
    } else {
      localStorage.setItem(LS.leads, JSON.stringify(leads));
      localStorage.setItem(LS.tasks, JSON.stringify(tasks));
      localStorage.setItem(LS.activity, JSON.stringify(activity));
      localStorage.setItem(LS.team, JSON.stringify(team));
    }

    // Schedule debounced cloud save
    if (binId && binKey) {
      setSyncState('saving');
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(async () => {
        const ok = await jsonbin.cloudSave(binId, binKey, {
          leads: nextLeads,
          tasks: nextTasks,
          activity: nextActivity,
          team: nextTeam,
        });
        setSyncState(ok ? 'saved' : 'error');
      }, 800);
    } else {
      setSyncState('offline');
    }
  };

  // Load from cloud function
  const reloadFromCloud = async (): Promise<boolean> => {
    if (!binId || !binKey) return false;
    setSyncState('loading');
    const data = await jsonbin.cloudLoad(binId, binKey);
    if (data) {
      if (data.leads) {
        setLeads(data.leads);
        localStorage.setItem(LS.leads, JSON.stringify(data.leads));
      }
      if (data.tasks) {
        setTasks(data.tasks);
        localStorage.setItem(LS.tasks, JSON.stringify(data.tasks));
      }
      if (data.activity) {
        setActivity(data.activity);
        localStorage.setItem(LS.activity, JSON.stringify(data.activity));
      }
      if (data.team) {
        setTeam(data.team);
        localStorage.setItem(LS.team, JSON.stringify(data.team));
      }
      setSyncState('saved');
      return true;
    } else {
      setSyncState('error');
      return false;
    }
  };

  // Initial Sync loading or setting sync State
  useEffect(() => {
    if (binId && binKey) {
      reloadFromCloud();
    } else {
      setSyncState('offline');
    }
  }, [binId, binKey]);

  // Sync interval loader (Poll remote changes every 30s - matches original setInterval)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!binId || !binKey) return;
      const data = await jsonbin.cloudLoad(binId, binKey);
      if (!data) return;

      let changed = false;

      // Deep compare logic to merge leads safely
      setLeads((prevLeads) => {
        const localIds = new Set(prevLeads.map((l) => l.id));
        let nextLeads = [...prevLeads];
        let subChanged = false;

        (data.leads || []).forEach((rl: Lead) => {
          if (!localIds.has(rl.id)) {
            nextLeads.push(rl);
            subChanged = true;
          } else {
            const index = nextLeads.findIndex((l) => l.id === rl.id);
            if (index >= 0 && JSON.stringify(nextLeads[index]) !== JSON.stringify(rl)) {
              nextLeads[index] = rl;
              subChanged = true;
            }
          }
        });

        if (subChanged) {
          localStorage.setItem(LS.leads, JSON.stringify(nextLeads));
          changed = true;
          return nextLeads;
        }
        return prevLeads;
      });

      // Activities length checking
      setActivity((prevActivity) => {
        if ((data.activity || []).length > prevActivity.length) {
          localStorage.setItem(LS.activity, JSON.stringify(data.activity));
          changed = true;
          return data.activity;
        }
        return prevActivity;
      });

      // Tasks length comparison
      setTasks((prevTasks) => {
        if ((data.tasks || []).length !== prevTasks.length) {
          localStorage.setItem(LS.tasks, JSON.stringify(data.tasks));
          changed = true;
          return data.tasks;
        }
        return prevTasks;
      });

      if (changed) {
        setSyncState('saved');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [binId, binKey]);

  return (
    <CRMContext.Provider
      value={{
        leads,
        setLeads,
        tasks,
        setTasks,
        activity,
        setActivity,
        team,
        setTeam,
        currentView,
        setCurrentView,
        currentDetailId,
        setCurrentDetailId,
        activeMemberFilter,
        setActiveMemberFilter,
        currentPipelineView,
        setCurrentPipelineView,
        openCommentLeadId,
        setOpenCommentLeadId,
        detailCommentSentiment,
        setDetailCommentSentiment,
        pipelineCommentSentiment,
        setPipelineCommentSentiment,
        binId,
        setBinId,
        binKey,
        setBinKey,
        syncState,
        setSyncState,
        toastMsg,
        showToast,
        toast,
        triggerSave,
        reloadFromCloud,
        activeModal,
        setActiveModal,
        editLeadId,
        setEditLeadId,
        preselectedLeadId,
        setPreselectedLeadId,
        uploadResultsHtml,
        setUploadResultsHtml,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
