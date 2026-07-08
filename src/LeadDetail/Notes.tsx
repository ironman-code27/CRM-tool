import React, { useState } from 'react';
import type { Lead } from '../types/Lead';
import type { TeamMember } from '../types/TeamMember';

interface NotesProps {
  lead: Lead;
  team: TeamMember[];
  leads: Lead[];
  detailCommentSentiment: 'positive' | 'neutral' | 'negative';
  setDetailCommentSentiment: (sentiment: 'positive' | 'neutral' | 'negative') => void;
  triggerSave: any;
  toast: any;
}

export const Notes: React.FC<NotesProps> = ({
  lead,
  team,
  leads,
  detailCommentSentiment,
  setDetailCommentSentiment,
  triggerSave,
  toast,
}) => {
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(team[0]?.name || '');

  const handleAddComment = () => {
    const text = commentText.trim();
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
      sentiment: detailCommentSentiment,
    };

    const nextLeads = leads.map((x) =>
      x.id === lead.id ? { ...x, comments: [...(x.comments || []), newComment] } : x
    );

    triggerSave({ leads: nextLeads });
    setCommentText('');
    toast('Note added');
  };

  return (
    <div className="card" style={{ marginTop: '14px' }}>
      <div className="card-header">
        <span className="card-header-title">Comments &amp; prospect feedback</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div
          id="detail-comments-list"
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {(lead.comments || []).length ? (
            (lead.comments || []).map((c, i) => {
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
            <div className="cp-empty">No notes yet. Add the first one below.</div>
          )}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Posting as:</span>
            <select
              id="detail-comment-author"
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
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: '4px' }}>
              Prospect tone:
            </span>
            <button
              className={`sent-btn ${detailCommentSentiment === 'positive' ? 'sel-positive' : ''}`}
              onClick={() => setDetailCommentSentiment('positive')}
            >
              Positive
            </button>
            <button
              className={`sent-btn ${detailCommentSentiment === 'neutral' ? 'sel-neutral' : ''}`}
              onClick={() => setDetailCommentSentiment('neutral')}
            >
              Neutral
            </button>
            <button
              className={`sent-btn ${detailCommentSentiment === 'negative' ? 'sel-negative' : ''}`}
              onClick={() => setDetailCommentSentiment('negative')}
            >
              Negative
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              className="cp-textarea"
              id="detail-comment-input"
              placeholder="Log what the prospect said or how they responded…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
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
export default Notes;
