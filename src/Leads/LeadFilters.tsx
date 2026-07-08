import React from 'react';

interface LeadFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStage: string;
  setFilterStage: (stage: string) => void;
  filterAssignee: string;
  setFilterAssignee: (assignee: string) => void;
  filterService: string;
  setFilterService: (service: string) => void;
  filterChannel: string;
  setFilterChannel: (channel: string) => void;
  uniqueAssignees: string[];
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filterStage,
  setFilterStage,
  filterAssignee,
  setFilterAssignee,
  filterService,
  setFilterService,
  filterChannel,
  setFilterChannel,
  uniqueAssignees,
}) => {
  return (
    <div className="filter-bar">
      <input
        type="text"
        id="search-input"
        placeholder="Search name, company, email…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <select
        id="filter-stage"
        value={filterStage}
        onChange={(e) => setFilterStage(e.target.value)}
      >
        <option value="">All stages</option>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="qualified">Qualified</option>
        <option value="closed">Closed</option>
      </select>
      <select
        id="filter-assignee"
        value={filterAssignee}
        onChange={(e) => setFilterAssignee(e.target.value)}
      >
        <option value="">All assignees</option>
        {uniqueAssignees.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <select
        id="filter-service"
        value={filterService}
        onChange={(e) => setFilterService(e.target.value)}
      >
        <option value="">All services</option>
        <option value="cyber">Cybersecurity</option>
        <option value="cloud">IT / Cloud</option>
        <option value="saas">Software / SaaS</option>
      </select>
      <select
        id="filter-channel"
        value={filterChannel}
        onChange={(e) => setFilterChannel(e.target.value)}
      >
        <option value="">All channels</option>
        <option value="linkedin">LinkedIn</option>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="event">In-person</option>
      </select>
    </div>
  );
};
export default LeadFilters;
