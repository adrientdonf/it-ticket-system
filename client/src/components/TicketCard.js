import React, { useState } from 'react';
import CommentSection from './CommentSection';

// ── Config Maps ───────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  low:    { label: 'LOW',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)'  },
  medium: { label: 'MEDIUM', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)'  },
  high:   { label: 'HIGH',   color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
};

const STATUS_CONFIG = {
  open:        { label: 'OPEN',        color: '#89CFF0', bg: 'rgba(137,207,240,0.1)', border: 'rgba(137,207,240,0.25)' },
  in_progress: { label: 'IN PROGRESS', color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)' },
  closed:      { label: 'CLOSED',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)'  },
};

// ── TicketCard ────────────────────────────────────────────────────────────────
// onSelect → clicking the title opens the expanded ticket view in App.js
// ─────────────────────────────────────────────────────────────────────────────

function TicketCard({ ticket, onEdit, onDelete, onSelect, currentUser }) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const status   = STATUS_CONFIG[ticket.status]     || STATUS_CONFIG.open;

  const [showComments, setShowComments] = useState(false);

  const isAdmin   = currentUser?.role === 'admin';
  const isOwner   = ticket.created_by?.toLowerCase() === currentUser?.username?.toLowerCase();
  const canModify = isAdmin || isOwner;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(137,207,240,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >

      {/* ── Top row: ticket ID + badges ── */}
      <div className="flex items-center justify-between">
        <span
          className="text-label-caps font-bold"
          style={{ color: 'rgba(137,207,240,0.5)', letterSpacing: '0.08em' }}
        >
          #{ticket.id}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-label-caps px-3 py-1 rounded-full font-bold"
            style={{ color: priority.color, background: priority.bg, border: `1px solid ${priority.border}` }}
          >
            {priority.label}
          </span>
          <span
            className="text-label-caps px-3 py-1 rounded-full font-bold"
            style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* ── Title + description — click title to open expanded view ── */}
      <div className="flex flex-col gap-1">
        <h3
          className="text-title-md font-semibold leading-snug transition-colors"
          style={{ color: '#e2e2e2', cursor: 'pointer' }}
          onClick={() => onSelect && onSelect(ticket)}
          onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
          onMouseLeave={e => e.currentTarget.style.color = '#e2e2e2'}
        >
          {ticket.title}
        </h3>
        <p className="text-body-sm text-on-surface-variant line-clamp-2">
          {ticket.description}
        </p>
      </div>

      {/* ── Footer: meta + actions ── */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Created by + date */}
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
          <span>{ticket.created_by}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{formatDate(ticket.created_at)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">

          {/* Comments toggle */}
          <button
            onClick={() => setShowComments(prev => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-sm transition-all"
            style={{
              color: showComments ? '#89CFF0' : '#bfc8cd',
              background: showComments ? 'rgba(137,207,240,0.1)' : 'transparent',
              border: `1px solid ${showComments ? 'rgba(137,207,240,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {showComments ? 'comment' : 'chat_bubble'}
            </span>
            {showComments ? 'Hide' : 'Comments'}
          </button>

          {/* Edit + Delete */}
          {canModify && (
            <>
              <button
                onClick={() => onEdit(ticket)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-sm transition-all"
                style={{ color: '#bfc8cd', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#89CFF0';
                  e.currentTarget.style.borderColor = 'rgba(137,207,240,0.3)';
                  e.currentTarget.style.background = 'rgba(137,207,240,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#bfc8cd';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                Edit
              </button>

              <button
                onClick={() => onDelete(ticket.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-sm transition-all"
                style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Comment Section (inline toggle) ── */}
      {showComments && (
        <div className="pt-4 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <CommentSection ticketId={ticket.id} currentUser={currentUser} />
        </div>
      )}

    </div>
  );
}

export default TicketCard;