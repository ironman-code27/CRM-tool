import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import LeadFilters from './LeadFilters';
import LeadsTable from './LeadsTable';
import { fullName } from '../utils/helpers';

export const Leads: React.FC = () => {
  const { leads, team, activity, tasks, setCurrentView, setCurrentDetailId } = useCRM();

  // 1. Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [sortBy, setSortByState] = useState(() => {
    return localStorage.getItem('tx-leads-sort-by') || 'newest';
  });

  const setSortBy = (val: string) => {
    setSortByState(val);
    localStorage.setItem('tx-leads-sort-by', val);
  };

  // 2. Fetch unique assignees in active database to populate assignee filter dropdown
  const uniqueAssignees = useMemo(() => {
    return [...new Set(leads.map((l) => l.assignee).filter(Boolean))];
  }, [leads]);

  // 3. Process lead filtering
  const filteredLeads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return leads.filter((l) => {
      // Search text query matching name, company, email
      if (
        q &&
        !fullName(l).toLowerCase().includes(q) &&
        !l.company.toLowerCase().includes(q) &&
        !(l.email || '').toLowerCase().includes(q)
      ) {
        return false;
      }

      // Stage query
      if (filterStage && l.stage !== filterStage) return false;

      // Assignee query
      if (filterAssignee && l.assignee !== filterAssignee) return false;

      // Services interest query
      if (filterService && !(l.services || []).includes(filterService as any)) return false;

      // Contact channels activity query
      if (filterChannel) {
        const hasChannelTouchpoint = activity.some(
          (a) => a.leadId === l.id && a.channel === filterChannel
        );
        if (!hasChannelTouchpoint) return false;
      }

      return true;
    });
  }, [leads, activity, searchQuery, filterStage, filterAssignee, filterService, filterChannel]);

  // 4. Sort filtered leads
  const sortedLeads = useMemo(() => {
    const list = [...filteredLeads];

    const getFollowUpDate = (leadId: string) => {
      const leadTasks = tasks.filter((t) => t.leadId === leadId && !t.done && t.due);
      if (leadTasks.length === 0) return null;
      const dates = leadTasks.map((t) => new Date(t.due).getTime()).filter((time) => !isNaN(time));
      if (dates.length === 0) return null;
      return Math.min(...dates);
    };

    const stageWeights = {
      qualified: 3,
      contacted: 2,
      new: 1,
      closed: 0,
    };

    list.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (a.created || '').localeCompare(b.created || '');
        case 'company-az':
          return (a.company || '').localeCompare(b.company || '');
        case 'company-za':
          return (b.company || '').localeCompare(a.company || '');
        case 'status':
          return (a.stage || '').localeCompare(b.stage || '');
        case 'priority': {
          const wA = stageWeights[a.stage] !== undefined ? stageWeights[a.stage] : -1;
          const wB = stageWeights[b.stage] !== undefined ? stageWeights[b.stage] : -1;
          return wB - wA;
        }
        case 'followup-nearest': {
          const dateA = getFollowUpDate(a.id);
          const dateB = getFollowUpDate(b.id);
          if (dateA !== null && dateB !== null) return dateA - dateB;
          if (dateA !== null) return -1;
          if (dateB !== null) return 1;
          return 0;
        }
        case 'followup-latest': {
          const dateA = getFollowUpDate(a.id);
          const dateB = getFollowUpDate(b.id);
          if (dateA !== null && dateB !== null) return dateB - dateA;
          if (dateA !== null) return -1;
          if (dateB !== null) return 1;
          return 0;
        }
        case 'newest':
        default:
          return (b.created || '').localeCompare(a.created || '');
      }
    });

    return list;
  }, [filteredLeads, sortBy, tasks]);

  const handleViewDetail = (id: string) => {
    setCurrentDetailId(id);
    setCurrentView('detail');
  };

  return (
    <div id="view-leads" className="view active">
      <div className="card">
        {/* Filter Bar */}
        <LeadFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStage={filterStage}
          setFilterStage={setFilterStage}
          filterAssignee={filterAssignee}
          setFilterAssignee={setFilterAssignee}
          filterService={filterService}
          setFilterService={setFilterService}
          filterChannel={filterChannel}
          setFilterChannel={setFilterChannel}
          uniqueAssignees={uniqueAssignees}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* Lead Table Grid */}
        <LeadsTable
          leads={sortedLeads}
          team={team}
          activity={activity}
          onViewDetail={handleViewDetail}
        />
      </div>
    </div>
  );
};
export default Leads;
