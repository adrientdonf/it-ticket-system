import React, { useState } from 'react';
import CommentSection from './CommentSection';
import { summarizeTicket } from '../services/api';

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
function TicketCard({ ticket, onEdit, onDelete, onSelect, currentUser }) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const status   = STATUS_CONFIG[ticket.status]     || STATUS_CONFIG.open;

  const [showComments, setShowComments] = useState(false);

  // ── AI Summary state ────────────────────────────────────────────────────────
  const [showAI,     setShowAI]     = useState(false);
  const [aiData,     setAiData]     = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState('');

  const isAdmin   = currentUser?.role === 'admin';
  const isOwner   = ticket.created_by?.toLowerCase() === currentUser?.username?.toLowerCase();
  const canModify = isAdmin || isOwner;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  // ── AI Summary handler ──────────────────────────────────────────────────────
  const handleAISummary = async () => {
    if (showAI && aiData) { setShowAI(false); return; }
    setShowAI(true);
    if (aiData) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await summarizeTicket({
        title:       ticket.title,
        description: ticket.description,
        priority:    ticket.priority,
        status:      ticket.status,
        comments:    [],
      });
      setAiData(res.data.data);
    } catch (err) {
      setAiError('Failed to generate AI summary.');
    } finally {
      setAiLoading(false);
    }
  };

  // const severityColor = {
  //   critical: '#f87171',
  //   high:     '#fbbf24',
  //   medium:   '#c084fc',
  // };

  return (
    <>
      {/* ── Keyframes (injected once per card render, negligible cost) ── */}
      <style>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiPanelReveal {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes commentReveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.85); opacity: 0; }
          70%  { transform: scale(1.06); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes idGlow {
          0%,100% { text-shadow: 0 0 4px rgba(137,207,240,0.2); }
          50%     { text-shadow: 0 0 12px rgba(137,207,240,0.6), 0 0 24px rgba(137,207,240,0.2); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%);  }
        }
        @keyframes aiSparkle {
          0%,100% { filter: drop-shadow(0 0 2px rgba(137,207,240,0.3)); }
          50%     { filter: drop-shadow(0 0 8px rgba(137,207,240,0.9)) drop-shadow(0 0 16px rgba(137,207,240,0.3)); }
        }
        @keyframes borderPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(137,207,240,0); }
          50%     { box-shadow: 0 0 0 2px rgba(137,207,240,0.08); }
        }
        .ticket-shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .ticket-shimmer-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 45%; height: 100%;
          background: linear-gradient(30deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%);
          animation: shimmerSweep 2.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <div
        className="rounded-xl p-5 flex flex-col gap-4 transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'cardFadeUp 0.5s ease both, borderPulse 4s ease-in-out infinite',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(137,207,240,0.2)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
      >

        {/* ── Top row: ticket ID + badges ── */}
        <div className="flex items-center justify-between">
          <span
            className="text-label-caps font-bold"
            style={{
              color: 'rgba(137,207,240,0.5)',
              letterSpacing: '0.08em',
              animation: 'idGlow 3.5s ease-in-out infinite',
            }}
          >
            #{ticket.id}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-label-caps px-3 py-1 rounded-full font-bold"
              style={{
                color: priority.color,
                background: priority.bg,
                border: `1px solid ${priority.border}`,
                animation: 'badgePop 0.4s ease both',
                animationDelay: '0.1s',
              }}
            >
              {priority.label}
            </span>
            <span
              className="text-label-caps px-3 py-1 rounded-full font-bold"
              style={{
                color: status.color,
                background: status.bg,
                border: `1px solid ${status.border}`,
                animation: 'badgePop 0.4s ease both',
                animationDelay: '0.18s',
              }}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* ── Title + description ── */}
        <div
          className="flex flex-col gap-1"
          style={{ animation: 'cardFadeUp 0.5s ease both', animationDelay: '0.08s' }}
        >
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

        {/* ── AI Summary Panel ── */}
        {showAI && (
          <div style={{
            borderRadius: '10px',
            background: 'rgba(137,207,240,0.04)',
            border: '1px solid rgba(137,207,240,0.15)',
            padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            animation: 'aiPanelReveal 0.35s ease both',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px', color: '#89CFF0', animation: 'aiSparkle 2.5s ease-in-out infinite' }}
              >
                auto_awesome
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#89CFF0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Analysis
              </span>
            </div>

            {/* Loading */}
            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#899297', fontSize: '13px' }}>
                <div className="spinner" style={{ width: '14px', height: '14px' }} />
                Analyzing ticket...
              </div>
            )}

            {/* Error */}
            {aiError && (
              <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{aiError}</p>
            )}

            {/* AI Data */}
            {aiData && !aiLoading && (
              <>
                {/* Category + time badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 10px',
                    borderRadius: '999px', background: 'rgba(137,207,240,0.1)',
                    border: '1px solid rgba(137,207,240,0.2)', color: '#89CFF0',
                    animation: 'badgePop 0.35s ease both',
                  }}>
                    {aiData.category}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 10px',
                    borderRadius: '999px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#899297',
                    animation: 'badgePop 0.35s ease both',
                    animationDelay: '0.08s',
                  }}>
                    ⏱ {aiData.estimatedTime}
                  </span>
                </div>

                {/* Summary */}
                <div style={{ animation: 'aiPanelReveal 0.4s ease both', animationDelay: '0.1s' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#899297', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Summary</p>
                  <p style={{ fontSize: '13px', color: '#e2e2e2', margin: 0, lineHeight: 1.5 }}>{aiData.summary}</p>
                </div>

                {/* Suggested fix */}
                <div style={{ animation: 'aiPanelReveal 0.4s ease both', animationDelay: '0.18s' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#899297', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Suggested Fix</p>
                  <p style={{ fontSize: '13px', color: '#e2e2e2', margin: 0, lineHeight: 1.5 }}>{aiData.suggestedFix}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Footer: meta + actions ── */}
        <div
          className="flex items-center justify-between pt-3"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            animation: 'cardFadeUp 0.5s ease both',
            animationDelay: '0.16s',
          }}
        >
          {/* Created by + date */}
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
            <span>{ticket.created_by}</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>{formatDate(ticket.created_at)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>

            {/* AI Summary button — shimmer */}
            <button
              onClick={handleAISummary}
              className="ticket-shimmer-btn flex items-center gap-1 px-3 py-1.5 rounded-lg text-body-sm transition-all"
              style={{
                color: showAI ? '#89CFF0' : '#bfc8cd',
                background: showAI ? 'rgba(137,207,240,0.1)' : 'transparent',
                border: `1px solid ${showAI ? 'rgba(137,207,240,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
              onMouseEnter={e => {
                if (!showAI) {
                  e.currentTarget.style.color = '#89CFF0';
                  e.currentTarget.style.borderColor = 'rgba(137,207,240,0.3)';
                  e.currentTarget.style.background = 'rgba(137,207,240,0.08)';
                }
              }}
              onMouseLeave={e => {
                if (!showAI) {
                  e.currentTarget.style.color = '#bfc8cd';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
              AI
            </button>

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

        {/* ── Comment Section ── */}
        {showComments && (
          <div
            className="pt-4 mt-1"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              animation: 'commentReveal 0.35s ease both',
            }}
          >
            <CommentSection ticketId={ticket.id} currentUser={currentUser} />
          </div>
        )}

      </div>
    </>
  );
}

export default TicketCard;