import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { nameInitials } from '../utils/helpers';

export const Sidebar: React.FC = () => {
  const {
    leads,
    tasks,
    activity,
    team,
    currentView,
    setCurrentView,
  } = useCRM();

  const [imageError, setImageError] = useState(false);

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const openTasksCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="sidebar">
      {/* Logo Wrapper */}
      <div className="logo-wrap">
        <div className="logo-mark" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          {!imageError ? (
            <img
              src="https://tekxera.com/wp-content/uploads/2023/03/TekXera_Color.png"
              alt="TekXera"
              onError={() => setImageError(true)}
              style={{
                height: '38px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
          ) : null}
          {imageError ? (
            <div id="tx-fallback" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="logo-icon">TX</div>
              <div className="logo-text">TekXera</div>
            </div>
          ) : null}
        </div>
        <div className="logo-sub">Client Acquisition CRM</div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav">
        <div className="nav-section">Overview</div>
        <div
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </div>
        <div
          className={`nav-item ${currentView === 'pipeline' ? 'active' : ''}`}
          onClick={() => setCurrentView('pipeline')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="4" height="18" rx="1" />
            <rect x="10" y="3" width="4" height="13" rx="1" />
            <rect x="17" y="3" width="4" height="8" rx="1" />
          </svg>
          Pipeline
          <span className="nav-badge" id="nb-pipeline">
            {leads.length}
          </span>
        </div>

        <div className="nav-section">Manage</div>
        <div
          className={`nav-item ${currentView === 'leads' ? 'active' : ''}`}
          onClick={() => setCurrentView('leads')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          All leads
        </div>
        <div
          className={`nav-item ${currentView === 'activity' ? 'active' : ''}`}
          onClick={() => setCurrentView('activity')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Activity log
          <span className="nav-badge" id="nb-activity">
            {activity.length}
          </span>
        </div>
        <div
          className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
          onClick={() => setCurrentView('tasks')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Tasks
          <span className="nav-badge" id="nb-tasks">
            {openTasksCount}
          </span>
        </div>

        <div className="nav-section">Settings</div>
        <div
          className={`nav-item ${currentView === 'team' ? 'active' : ''}`}
          onClick={() => setCurrentView('team')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
          </svg>
          Team members
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-date" id="footer-date">
          {dateStr}
        </div>
        <div className="team-mini" id="team-mini-avatars">
          {team.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className="team-avatar-sm"
              style={{
                background: `${m.color}22`,
                color: m.color,
              }}
              title={m.name}
            >
              {nameInitials(m.name)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
