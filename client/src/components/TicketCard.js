import React from 'react';

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

function TicketCard({ ticket, onEdit, onDelete }) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.low;
  const status   = STATUS_CONFIG[ticket.status]     || STATUS_CONFIG.open;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <div className="ticket-card">
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

      <h3 className="ticket-card__title">{ticket.title}</h3>
      <p className="ticket-card__desc">{ticket.description}</p>

      <div className="ticket-card__footer">
        <div className="ticket-card__meta">
          <span>By <strong>{ticket.created_by}</strong></span>
          <span className="dot">·</span>
          <span>{formatDate(ticket.created_at)}</span>
        </div>
        <div className="ticket-card__actions">
          <button className="btn btn--ghost" onClick={() => onEdit(ticket)}>Edit</button>
          <button className="btn btn--danger" onClick={() => onDelete(ticket.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;