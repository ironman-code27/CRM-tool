import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import type { HistoryEntry } from '../types/HistoryEntry';

export const HistoryPage: React.FC = () => {
  const { historyList, team } = useCRM();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterMember, setFilterMember] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  // Pagination state
  const [pageSize, setPageSize] = useState(15);

  // Side drawer state
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  // Helper to check date groupings
  const parseDate = (dateStr: string) => new Date(dateStr);

  const getRelativeTimeString = (dateStr: string): string => {
    const date = parseDate(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMs < 60000) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getGroupLabel = (dateStr: string): string => {
    const date = parseDate(dateStr);
    const now = new Date();
    
    // Reset hours to midnight for correct day boundary comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    const compareTime = date.getTime();

    if (compareTime >= today.getTime()) {
      return 'Today';
    } else if (compareTime >= yesterday.getTime()) {
      return 'Yesterday';
    } else if (compareTime >= startOfWeek.getTime()) {
      return 'This Week';
    } else if (compareTime >= startOfLastWeek.getTime()) {
      return 'Last Week';
    } else {
      return 'Older';
    }
  };

  // Filtered list
  const filteredHistory = useMemo(() => {
    return historyList.filter((entry) => {
      // 1. Search term (Search title, description, name, performed_by)
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        entry.action.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.entity_name.toLowerCase().includes(query) ||
        entry.performed_by.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Filter Module
      if (filterModule !== 'all' && entry.module !== filterModule) return false;

      // 3. Filter Action
      if (filterAction !== 'all' && entry.action !== filterAction) return false;

      // 4. Filter Team Member
      if (filterMember !== 'all' && entry.performed_by !== filterMember) return false;

      // 5. Filter Date Range
      if (filterDateRange !== 'all') {
        const date = parseDate(entry.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);

        if (filterDateRange === 'today' && date.getTime() < today.getTime()) return false;
        if (filterDateRange === 'yesterday' && (date.getTime() < yesterday.getTime() || date.getTime() >= today.getTime())) return false;
        if (filterDateRange === 'week' && date.getTime() < startOfWeek.getTime()) return false;
      }

      return true;
    });
  }, [historyList, searchTerm, filterModule, filterAction, filterMember, filterDateRange]);

  // Paginated list
  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice(0, pageSize);
  }, [filteredHistory, pageSize]);

  // Grouped list
  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      'Last Week': [],
      Older: [],
    };

    paginatedHistory.forEach((entry) => {
      const label = getGroupLabel(entry.created_at);
      if (groups[label]) {
        groups[label].push(entry);
      } else {
        groups['Older'].push(entry);
      }
    });

    return groups;
  }, [paginatedHistory]);

  // Icon mapping
  const getIconClass = (module: string): string => {
    switch (module.toLowerCase()) {
      case 'leads':
        return 'history-icon-leads';
      case 'tasks':
        return 'history-icon-tasks';
      case 'team':
        return 'history-icon-team';
      case 'import / export':
      case 'import/export':
        return 'history-icon-csv';
      default:
        return 'history-icon-system';
    }
  };

  const getModuleIconSvg = (module: string) => {
    switch (module.toLowerCase()) {
      case 'leads':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        );
      case 'tasks':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        );
      case 'team':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          </svg>
        );
      case 'import / export':
      case 'import/export':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l3 3" />
          </svg>
        );
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('Created') || action.includes('Added')) return { background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
    if (action.includes('Deleted') || action.includes('Removed')) return { background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
    if (action.includes('Updated') || action.includes('Changed') || action.includes('Edited')) return { background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' };
    return { background: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
  };

  const handleRowClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
  };

  const closeDrawer = () => {
    setSelectedEntry(null);
  };

  // Get unique modules and actions for select filters
  const uniqueModules = useMemo(() => {
    return Array.from(new Set(historyList.map((e) => e.module))).filter(Boolean);
  }, [historyList]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(historyList.map((e) => e.action))).filter(Boolean);
  }, [historyList]);

  return (
    <div className="history-container">
      {/* ── FILTERS BAR ── */}
      <div className="history-filter-bar">
        {/* Search */}
        <div className="history-filter-group" style={{ flex: '1 1 200px' }}>
          <label>Search History</label>
          <input
            type="text"
            className="history-filter-input"
            style={{ width: '100%' }}
            placeholder="Search action, user, lead name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Date Range Selector */}
        <div className="history-filter-group">
          <label>Date</label>
          <select
            className="history-filter-select"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
          </select>
        </div>

        {/* Module Selector */}
        <div className="history-filter-group">
          <label>Module</label>
          <select
            className="history-filter-select"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
          >
            <option value="all">All Modules</option>
            {uniqueModules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Action Selector */}
        <div className="history-filter-group">
          <label>Action</label>
          <select
            className="history-filter-select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Team Member Selector */}
        <div className="history-filter-group">
          <label>User</label>
          <select
            className="history-filter-select"
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
          >
            <option value="all">All Users</option>
            {team.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── TIMELINE VIEW ── */}
      <div className="history-timeline-section">
        {Object.keys(groupedHistory).map((groupKey) => {
          const items = groupedHistory[groupKey];
          if (!items.length) return null;

          return (
            <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="history-timeline-group-title">{groupKey}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((entry) => {
                  const iconClass = getIconClass(entry.module);
                  const badgeColor = getActionBadgeColor(entry.action);
                  return (
                    <div
                      key={entry.id}
                      className="history-timeline-row"
                      onClick={() => handleRowClick(entry)}
                    >
                      {/* Left icon */}
                      <div className={`history-timeline-icon-wrapper ${iconClass}`}>
                        {getModuleIconSvg(entry.module)}
                      </div>

                      {/* Content */}
                      <div className="history-timeline-content">
                        <div className="history-timeline-header">
                          <span className="history-timeline-title">{entry.action}</span>
                          <span className="history-timeline-meta">
                            <span>{getRelativeTimeString(entry.created_at)}</span>
                            <span>·</span>
                            <span>{entry.performed_by}</span>
                          </span>
                        </div>
                        <div className="history-timeline-desc">{entry.description}</div>
                        
                        {/* Badges footer */}
                        <div className="history-timeline-footer">
                          <span className="history-badge history-badge-module">
                            {entry.module}
                          </span>
                          <span
                            className="history-badge history-badge-action"
                            style={{
                              background: badgeColor.background,
                              color: badgeColor.color,
                            }}
                          >
                            {entry.action}
                          </span>
                          {entry.entity_name && (
                            <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 500 }}>
                              Record: {entry.entity_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕰</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>No activity logs found</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Try adjusting your filters or search query.</div>
          </div>
        )}

        {filteredHistory.length > pageSize && (
          <div className="history-load-more">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setPageSize((prev) => prev + 15)}
            >
              Load more activity
            </button>
          </div>
        )}
      </div>

      {/* ── DETAIL PANEL / SIDE DRAWER ── */}
      <div
        className={`history-drawer-overlay ${selectedEntry ? 'open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closeDrawer()}
      >
        <div className="history-drawer">
          <div className="history-drawer-header">
            <span className="history-drawer-title">History Details</span>
            <button className="history-drawer-close" onClick={closeDrawer}>
              ✕
            </button>
          </div>
          {selectedEntry && (
            <div className="history-drawer-body">
              {/* Action Type */}
              <div className="history-drawer-section">
                <span className="history-drawer-section-label">Action</span>
                <span className="history-drawer-section-value" style={{ fontWeight: 600 }}>
                  {selectedEntry.action}
                </span>
              </div>

              {/* Module */}
              <div className="history-drawer-section">
                <span className="history-drawer-section-label">Module</span>
                <span className="history-drawer-section-value">
                  {selectedEntry.module}
                </span>
              </div>

              {/* Performed By */}
              <div className="history-drawer-section">
                <span className="history-drawer-section-label">Performed By</span>
                <span className="history-drawer-section-value">
                  {selectedEntry.performed_by}
                </span>
              </div>

              {/* Timestamp */}
              <div className="history-drawer-section">
                <span className="history-drawer-section-label">Timestamp</span>
                <span className="history-drawer-section-value">
                  {new Date(selectedEntry.created_at).toLocaleString('en-GB')}
                </span>
              </div>

              {/* Record info */}
              {selectedEntry.entity_name && (
                <div className="history-drawer-section">
                  <span className="history-drawer-section-label">Record Details</span>
                  <span className="history-drawer-section-value">
                    {selectedEntry.entity_name} {selectedEntry.entity_id ? `(ID: ${selectedEntry.entity_id})` : ''}
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="history-drawer-section">
                <span className="history-drawer-section-label">Description</span>
                <span className="history-drawer-section-value">
                  {selectedEntry.description}
                </span>
              </div>

              {/* Values Diff */}
              {(selectedEntry.old_value || selectedEntry.new_value) && (
                <div className="history-drawer-section">
                  <span className="history-drawer-section-label">Changes</span>
                  <div className="history-diff-container">
                    {selectedEntry.old_value && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600 }}>Previous value</span>
                        <div className="history-diff-val old">{selectedEntry.old_value}</div>
                      </div>
                    )}
                    
                    {selectedEntry.old_value && selectedEntry.new_value && (
                      <div className="history-diff-arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="19 12 12 19 5 12" />
                        </svg>
                      </div>
                    )}

                    {selectedEntry.new_value && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600 }}>New value</span>
                        <div className="history-diff-val new">{selectedEntry.new_value}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
