import React from 'react';

// ── Config Maps ───────────────────────────────────────────────────────────────
// Maps priority/status values to display labels and colors
const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#10b981', bg: '#d1fae5' },
  medium: { label: 'Medium', color: '#d97706', bg: '#fef3c7' },
  high:   { label: 'High',   color: '#ef4444', bg: '#fee2e2' },
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: '#3b82f6', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#8b5cf6', bg: '#ede9fe' },
  closed:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
};

// ── TicketCard ────────────────────────────────────────────────────────────────
// Displays a single ticket with priority/status badges.
// Role-based access:
//   - admin     → can edit and delete ANY ticket
//   - employee  → can only edit and delete tickets THEY created
// ─────────────────────────────────────────────────────────────────────────────

function TicketCard({ ticket, onEdit, onDelete, currentUser }) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const status   = STATUS_CONFIG[ticket.status]     || STATUS_CONFIG.open;

  // ── Permission Check ────────────────────────────────────────────────────────
  // Admins can do anything.
  // Employees can only edit/delete tickets where created_by matches their username.
  const isAdmin   = currentUser?.role === 'admin';
  const isOwner   = ticket.created_by?.toLowerCase() === currentUser?.username?.toLowerCase();
  const canModify = isAdmin || isOwner;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <div className="ticket-card">

      {/* ── Top row: ticket ID + badges ── */}
      <div className="ticket-card__header">
        <span className="ticket-card__id">#{ticket.id}</span>
        <div className="ticket-card__badges">
          <span className="badge" style={{ color: priority.color, background: priority.bg }}>
            {priority.label}
          </span>
          <span className="badge" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* ── Ticket content ── */}
      <h3 className="ticket-card__title">{ticket.title}</h3>
      <p className="ticket-card__desc">{ticket.description}</p>

      {/* ── Footer: meta info + action buttons ── */}
      <div className="ticket-card__footer">
        <div className="ticket-card__meta">
          <span>By <strong>{ticket.created_by}</strong></span>
          <span className="dot">·</span>
          <span>{formatDate(ticket.created_at)}</span>
        </div>

        {/* Only render Edit/Delete if user has permission */}
        {canModify && (
          <div className="ticket-card__actions">
            <button className="btn btn--ghost" onClick={() => onEdit(ticket)}>
              Edit
            </button>
            <button className="btn btn--danger" onClick={() => onDelete(ticket.id)}>
              Delete
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default TicketCard;