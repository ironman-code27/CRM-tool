import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import LeadFilters from './LeadFilters';
import LeadsTable from './LeadsTable';
import { fullName } from '../utils/helpers';

export const Leads: React.FC = () => {
  const { leads, team, activity, setCurrentView, setCurrentDetailId } = useCRM();

  // 1. Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

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
        />

        {/* Lead Table Grid */}
        <LeadsTable
          leads={filteredLeads}
          team={team}
          activity={activity}
          onViewDetail={handleViewDetail}
        />
      </div>
    </div>
  );
};
export default Leads;
