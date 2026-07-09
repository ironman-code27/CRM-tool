import React, { useState } from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';
import { fullName } from '../utils/helpers';

interface CommentsPanelProps {
  activeCommentLead: Lead;
  team: TeamMember[];
  leads: Lead[];
  pipelineCommentSentiment: 'positive' | 'neutral' | 'negative';
  setPipelineCommentSentiment: (sentiment: 'positive' | 'neutral' | 'negative') => void;
  setOpenCommentLeadId: (id: string | null) => void;
  triggerSave: any;
  toast: any;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  activeCommentLead,
  team,
  leads,
  pipelineCommentSentiment,
  setPipelineCommentSentiment,
  setOpenCommentLeadId,
  triggerSave,
  toast,
}) => {
  const [commentInput, setCommentInput] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(team[0]?.name || '');

  const handleAddComment = () => {
    const text = commentInput.trim();
    if (!text) return;

    const author = commentAuthor || team[0]?.name || 'Team';
    const now = new Date();
    const timeStr =
      now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ' ' +
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      author,
      role: 'BDE',
      time: timeStr,
      text,
      sentiment: pipelineCommentSentiment,
    };

    const nextLeads = leads.map((l) =>
      l.id === activeCommentLead.id ? { ...l, comments: [...(l.comments || []), newComment] } : l
    );

    triggerSave({ leads: nextLeads });
    setCommentInput('');
    toast('Note added');
  };

  return (
    <div id="comments-panel-container">
      <div className="comments-panel">
        <div className="cp-header">
          <span className="cp-title">
            Interaction log — {fullName(activeCommentLead)}, {activeCommentLead.company}
          </span>
          <button className="cp-close" onClick={() => setOpenCommentLeadId(null)}>
            ✕
          </button>
        </div>
        <div className="cp-body" id="cp-body-list">
          {(activeCommentLead.comments || []).length ? (
            (activeCommentLead.comments || []).map((c, i) => {
              const roleClass = c.role === 'BDE' ? 'cp-role-bde' : 'cp-role-am';
              return (
                <div key={i} className="cp-comment">
                  <div className="cp-comment-meta">
                    <span className="cp-author">{c.author}</span>
                    <span className={`cp-role-badge ${roleClass}`}>{c.role}</span>
                    <span className="cp-time">{c.time}</span>
                  </div>
                  <div className="cp-text">{c.text}</div>
                  <span className={`cp-sentiment sent-${c.sentiment}`}>
                    {c.sentiment.charAt(0).toUpperCase() + c.sentiment.slice(1)} prospect tone
                  </span>
                </div>
              );
            })
          ) : (
            <div className="cp-empty">
              No interaction notes yet. Add the first one below.
            </div>
          )}
        </div>
        <div className="cp-add-form">
          <div className="cp-form-row" style={{ alignItems: 'center', gap: '10px', flexDirection: 'row' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Posting as:</span>
            <select
              id="cp-author-sel"
              style={{ fontSize: '12px', padding: '4px 8px' }}
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
            >
              {team.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <div className="cp-sent-btns">
              <span className="cp-sent-label">Prospect tone:</span>
              <button
                className={`sent-btn ${pipelineCommentSentiment === 'positive' ? 'sel-positive' : ''}`}
                onClick={() => setPipelineCommentSentiment('positive')}
              >
                Positive
              </button>
              <button
                className={`sent-btn ${pipelineCommentSentiment === 'neutral' ? 'sel-neutral' : ''}`}
                onClick={() => setPipelineCommentSentiment('neutral')}
              >
                Neutral
              </button>
              <button
                className={`sent-btn ${pipelineCommentSentiment === 'negative' ? 'sel-negative' : ''}`}
                onClick={() => setPipelineCommentSentiment('negative')}
              >
                Negative
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <textarea
              className="cp-textarea"
              id="cp-comment-input"
              placeholder="Log what the prospect said, their objection, or how they responded…"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
              onClick={handleAddComment}
            >
              Add note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CommentsPanel;
