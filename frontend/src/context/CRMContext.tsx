import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Lead } from '../types/Lead';
import type { Task } from '../types/Task';
import type { Activity } from '../types/Activity';
import type { TeamMember } from '../types/TeamMember';
import type { HistoryEntry } from '../types/HistoryEntry';
import { SEED_TEAM } from '../constants/seedData';
import * as jsonbin from '../services/jsonbin';
import { getLeads, subscribeToLeads } from '../services/leadsService';
import { getTeam, createTeamMember, deleteTeamMember, subscribeToTeam } from '../services/teamService';
import * as historyService from '../services/historyService';

interface CRMContextType {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activity: Activity[];
  setActivity: React.Dispatch<React.SetStateAction<Activity[]>>;
  team: TeamMember[];
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  historyList: HistoryEntry[];
  setHistoryList: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  logManualHistory: (
    action: string,
    module: string,
    entityId: string,
    entityName: string,
    description: string,
    oldValue?: string,
    newValue?: string,
    metadata?: any
  ) => Promise<void>;
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
  triggerSave: (updates?: { leads?: Lead[]; tasks?: Task[]; activity?: Activity[]; team?: TeamMember[]; historyList?: HistoryEntry[] }) => void;
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
  history: 'tx-history-v2',
  binId: 'tx-bin-id',
  binKey: 'tx-bin-key',
};

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);


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

  const [team, setTeam] = useState<TeamMember[]>([]);

  const [historyList, setHistoryList] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LS.history);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
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

  // logManualHistory function
  const logManualHistory = async (
    action: string,
    module: string,
    entityId: string,
    entityName: string,
    description: string,
    oldValue = '',
    newValue = '',
    metadata: any = {}
  ) => {
    const performed_by = team[0]?.name || 'Admin';
    await historyService.createHistoryEntry({
      action,
      module,
      entity_id: entityId,
      entity_name: entityName,
      old_value: oldValue,
      new_value: newValue,
      description,
      performed_by,
      metadata,
    });
    const res = await historyService.getHistory();
    if (res.success && res.data) {
      setHistoryList(res.data);
      localStorage.setItem(LS.history, JSON.stringify(res.data));
    }
  };

  // Trigger Local and Cloud Save
  const triggerSave = (updates?: { leads?: Lead[]; tasks?: Task[]; activity?: Activity[]; team?: TeamMember[]; historyList?: HistoryEntry[] }) => {
    // Write local storage immediately
    let nextLeads = leads;
    let nextTasks = tasks;
    let nextActivity = activity;
    let nextTeam = team;
    let nextHistoryList = historyList;

    const user = team[0]?.name || 'Admin';

    if (updates) {
      if (updates.leads) {
        // Compare updates.leads with leads to automatically detect changes
        const oldLeadsMap = new Map(leads.map(l => [l.id, l]));
        const nextLeadsMap = new Map(updates.leads.map(l => [l.id, l]));

        // Lead Deleted
        leads.forEach(oldLead => {
          if (!nextLeadsMap.has(oldLead.id)) {
            historyService.createHistoryEntry({
              action: 'Lead Deleted',
              module: 'Leads',
              entity_id: oldLead.id,
              entity_name: `${oldLead.fname} ${oldLead.lname}`,
              old_value: `${oldLead.fname} ${oldLead.lname}`,
              new_value: '',
              description: `Lead "${oldLead.fname} ${oldLead.lname}" was deleted.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          }
        });

        // Lead Created / Lead Updated
        updates.leads.forEach(nextLead => {
          const oldLead = oldLeadsMap.get(nextLead.id);
          if (!oldLead) {
            // Lead Created
            historyService.createHistoryEntry({
              action: 'Lead Created',
              module: 'Leads',
              entity_id: nextLead.id,
              entity_name: `${nextLead.fname} ${nextLead.lname}`,
              old_value: '',
              new_value: `${nextLead.fname} ${nextLead.lname}`,
              description: `Lead "${nextLead.fname} ${nextLead.lname}" was created.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          } else {
            // Lead Updated
            // Assignee change
            if (oldLead.assignee !== nextLead.assignee) {
              historyService.createHistoryEntry({
                action: 'Lead Assigned',
                module: 'Leads',
                entity_id: nextLead.id,
                entity_name: `${nextLead.fname} ${nextLead.lname}`,
                old_value: oldLead.assignee || 'Unassigned',
                new_value: nextLead.assignee || 'Unassigned',
                description: `${user} changed "Assignee" of ${nextLead.fname} ${nextLead.lname} from "${oldLead.assignee || 'Unassigned'}" to "${nextLead.assignee || 'Unassigned'}".`,
                performed_by: user,
              }).then(() => historyService.getHistory().then(r => {
                if (r.data) {
                  setHistoryList(r.data);
                  localStorage.setItem(LS.history, JSON.stringify(r.data));
                }
              }));
            }
            // Stage change
            if (oldLead.stage !== nextLead.stage) {
              historyService.createHistoryEntry({
                action: 'Lead Stage Changed',
                module: 'Leads',
                entity_id: nextLead.id,
                entity_name: `${nextLead.fname} ${nextLead.lname}`,
                old_value: oldLead.stage,
                new_value: nextLead.stage,
                description: `${user} changed stage of "${nextLead.fname} ${nextLead.lname}" from "${oldLead.stage}" to "${nextLead.stage}".`,
                performed_by: user,
              }).then(() => historyService.getHistory().then(r => {
                if (r.data) {
                  setHistoryList(r.data);
                  localStorage.setItem(LS.history, JSON.stringify(r.data));
                }
              }));
            }
            // Notes change
            if (oldLead.notes !== nextLead.notes) {
              const actionType = !oldLead.notes ? 'Lead Notes Added' : 'Lead Notes Edited';
              historyService.createHistoryEntry({
                action: actionType,
                module: 'Leads',
                entity_id: nextLead.id,
                entity_name: `${nextLead.fname} ${nextLead.lname}`,
                old_value: oldLead.notes || '',
                new_value: nextLead.notes || '',
                description: `${user} updated notes for "${nextLead.fname} ${nextLead.lname}".`,
                performed_by: user,
              }).then(() => historyService.getHistory().then(r => {
                if (r.data) {
                  setHistoryList(r.data);
                  localStorage.setItem(LS.history, JSON.stringify(r.data));
                }
              }));
            }
            // Comments change
            const oldComments = oldLead.comments || [];
            const nextComments = nextLead.comments || [];
            if (oldComments.length !== nextComments.length) {
              if (nextComments.length > oldComments.length) {
                const addedComment = nextComments[nextComments.length - 1];
                historyService.createHistoryEntry({
                  action: 'Lead Comments Added',
                  module: 'Leads',
                  entity_id: nextLead.id,
                  entity_name: `${nextLead.fname} ${nextLead.lname}`,
                  old_value: '',
                  new_value: addedComment?.text || '',
                  description: `${addedComment?.author || user} added comment: "${addedComment?.text || ''}" [Prospect tone: ${addedComment?.sentiment || 'neutral'}].`,
                  performed_by: addedComment?.author || user,
                }).then(() => historyService.getHistory().then(r => {
                  if (r.data) {
                    setHistoryList(r.data);
                    localStorage.setItem(LS.history, JSON.stringify(r.data));
                  }
                }));
              } else {
                historyService.createHistoryEntry({
                  action: 'Lead Comments Deleted',
                  module: 'Leads',
                  entity_id: nextLead.id,
                  entity_name: `${nextLead.fname} ${nextLead.lname}`,
                  old_value: '',
                  new_value: '',
                  description: `${user} deleted comment from "${nextLead.fname} ${nextLead.lname}".`,
                  performed_by: user,
                }).then(() => historyService.getHistory().then(r => {
                  if (r.data) {
                    setHistoryList(r.data);
                    localStorage.setItem(LS.history, JSON.stringify(r.data));
                  }
                }));
              }
            }
          }
        });

        setLeads(updates.leads);
        nextLeads = updates.leads;
      }
      if (updates.tasks) {
        // Compare updates.tasks with tasks
        const oldTasksMap = new Map(tasks.map(t => [t.id, t]));
        const nextTasksMap = new Map(updates.tasks.map(t => [t.id, t]));

        // Task Deleted
        tasks.forEach(oldTask => {
          if (!nextTasksMap.has(oldTask.id)) {
            historyService.createHistoryEntry({
              action: 'Task Deleted',
              module: 'Tasks',
              entity_id: oldTask.id,
              entity_name: oldTask.text,
              old_value: oldTask.text,
              new_value: '',
              description: `Task "${oldTask.text}" was deleted.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          }
        });

        // Task Created / Updated
        updates.tasks.forEach(nextTask => {
          const oldTask = oldTasksMap.get(nextTask.id);
          if (!oldTask) {
            // Task Created
            historyService.createHistoryEntry({
              action: 'Task Created',
              module: 'Tasks',
              entity_id: nextTask.id,
              entity_name: nextTask.text,
              old_value: '',
              new_value: nextTask.text,
              description: `Task "${nextTask.text}" was created.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          } else {
            // Task Updated / Completed
            if (oldTask.done !== nextTask.done) {
              const actionType = nextTask.done ? 'Task Completed' : 'Task Updated';
              historyService.createHistoryEntry({
                action: actionType,
                module: 'Tasks',
                entity_id: nextTask.id,
                entity_name: nextTask.text,
                old_value: oldTask.done ? 'Completed' : 'Pending',
                new_value: nextTask.done ? 'Completed' : 'Pending',
                description: `${user} marked task "${nextTask.text}" as ${nextTask.done ? 'completed' : 'pending'}.`,
                performed_by: user,
              }).then(() => historyService.getHistory().then(r => {
                if (r.data) {
                  setHistoryList(r.data);
                  localStorage.setItem(LS.history, JSON.stringify(r.data));
                }
              }));
            } else if (oldTask.text !== nextTask.text || oldTask.due !== nextTask.due || oldTask.assignee !== nextTask.assignee) {
              historyService.createHistoryEntry({
                action: 'Task Updated',
                module: 'Tasks',
                entity_id: nextTask.id,
                entity_name: nextTask.text,
                old_value: oldTask.text,
                new_value: nextTask.text,
                description: `Task details for "${nextTask.text}" were updated.`,
                performed_by: user,
              }).then(() => historyService.getHistory().then(r => {
                if (r.data) {
                  setHistoryList(r.data);
                  localStorage.setItem(LS.history, JSON.stringify(r.data));
                }
              }));
            }
          }
        });

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
        // Compare updates.team with team
        const oldTeamMap = new Map(team.map(m => [m.id, m]));
        const nextTeamMap = new Map(updates.team.map(m => [m.id, m]));

        // Team Deleted
        team.forEach(oldMember => {
          if (!nextTeamMap.has(oldMember.id)) {
            historyService.createHistoryEntry({
              action: 'Team Member Deleted',
              module: 'Team',
              entity_id: oldMember.id,
              entity_name: oldMember.name,
              old_value: oldMember.name,
              new_value: '',
              description: `Team member "${oldMember.name}" was removed.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          }
        });

        // Team Created / Edited
        updates.team.forEach(nextMember => {
          const oldMember = oldTeamMap.get(nextMember.id);
          if (!oldMember) {
            // Team Added
            historyService.createHistoryEntry({
              action: 'Team Member Added',
              module: 'Team',
              entity_id: nextMember.id,
              entity_name: nextMember.name,
              old_value: '',
              new_value: nextMember.name,
              description: `New team member "${nextMember.name}" was added.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          } else if (oldMember.name !== nextMember.name || oldMember.status !== nextMember.status) {
            // Team Edited
            historyService.createHistoryEntry({
              action: 'Team Member Edited',
              module: 'Team',
              entity_id: nextMember.id,
              entity_name: nextMember.name,
              old_value: `${oldMember.name} (${oldMember.status || 'Active'})`,
              new_value: `${nextMember.name} (${nextMember.status || 'Active'})`,
              description: `Team member details for "${nextMember.name}" were edited.`,
              performed_by: user,
            }).then(() => historyService.getHistory().then(r => {
              if (r.data) {
                setHistoryList(r.data);
                localStorage.setItem(LS.history, JSON.stringify(r.data));
              }
            }));
          }
        });

        setTeam(updates.team);
        // Sync new member to Supabase
        const currentIds = new Set(team.map((m) => m.id));
        const newMembers = updates.team.filter((m) => !currentIds.has(m.id));
        newMembers.forEach((m) => {
          createTeamMember(m);
        });
        // Sync deleted member to Supabase
        const nextIds = new Set(updates.team.map((m) => m.id));
        const deletedMembers = team.filter((m) => !nextIds.has(m.id));
        deletedMembers.forEach((m) => {
          deleteTeamMember(m.id);
        });
        nextTeam = updates.team;
      }
      if (updates.historyList) {
        setHistoryList(updates.historyList);
        localStorage.setItem(LS.history, JSON.stringify(updates.historyList));
        nextHistoryList = updates.historyList;
      }
    } else {
      localStorage.setItem(LS.tasks, JSON.stringify(tasks));
      localStorage.setItem(LS.activity, JSON.stringify(activity));
      localStorage.setItem(LS.history, JSON.stringify(historyList));
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
          historyList: nextHistoryList,
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
      // Leads are loaded from Supabase separately
      if (data.tasks) {
        setTasks(data.tasks);
        localStorage.setItem(LS.tasks, JSON.stringify(data.tasks));
      }
      if (data.activity) {
        setActivity(data.activity);
        localStorage.setItem(LS.activity, JSON.stringify(data.activity));
      }
      if (data.historyList) {
        setHistoryList(data.historyList);
        localStorage.setItem(LS.history, JSON.stringify(data.historyList));
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

  // Load initial leads, and subscribe to realtime changes on startup
  useEffect(() => {
    // 1. Initial fetch from Supabase
    getLeads().then((res) => {
      if (res.success && res.data) {
        setLeads(res.data);
      }
    });

    // 2. Realtime subscription
    const unsubscribe = subscribeToLeads((latestLeads) => {
      setLeads(latestLeads);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load initial history on startup
  useEffect(() => {
    historyService.getHistory().then((res) => {
      if (res.success && res.data) {
        setHistoryList(res.data);
        localStorage.setItem(LS.history, JSON.stringify(res.data));
      }
    });
  }, []);

  // Load initial team, and subscribe to realtime changes on startup
  useEffect(() => {
    // 1. Initial fetch from Supabase
    getTeam().then((res) => {
      if (res.success && res.data) {
        setTeam(res.data.length > 0 ? res.data : SEED_TEAM);
      } else {
        setTeam(SEED_TEAM);
      }
    });

    // 2. Realtime subscription
    const unsubscribe = subscribeToTeam((latestTeam) => {
      setTeam(latestTeam.length > 0 ? latestTeam : SEED_TEAM);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync interval loader (Poll remote changes every 30s - matches original setInterval)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!binId || !binKey) return;
      const data = await jsonbin.cloudLoad(binId, binKey);
      if (!data) return;

      let changed = false;

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

      // History length comparison
      setHistoryList((prevHistory) => {
        if ((data.historyList || []).length > prevHistory.length) {
          localStorage.setItem(LS.history, JSON.stringify(data.historyList));
          changed = true;
          return data.historyList;
        }
        return prevHistory;
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
        historyList,
        setHistoryList,
        logManualHistory,
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
