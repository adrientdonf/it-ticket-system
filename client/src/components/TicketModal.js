import React, { useState, useEffect } from 'react';

// ── TicketModal ───────────────────────────────────────────────────────────────
// Used for both creating and editing tickets.
// When creating, auto-fills created_by from the logged-in user in localStorage.
// When editing, pre-fills all fields from the existing ticket.
// ─────────────────────────────────────────────────────────────────────────────

const getLoggedInUsername = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.username || '';
  } catch {
    return '';
  }
};

function TicketModal({ isOpen, onClose, onSubmit, editingTicket }) {
  const isEditing = Boolean(editingTicket);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:       '',
    description: '',
    priority:    'medium',
    status:      'open',
    created_by:  getLoggedInUsername(),
  });

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // ── Populate form when modal opens ──────────────────────────────────────────
  useEffect(() => {
    if (editingTicket) {
      setForm({
        title:       editingTicket.title       || '',
        description: editingTicket.description || '',
        priority:    editingTicket.priority    || 'medium',
        status:      editingTicket.status      || 'open',
        created_by:  editingTicket.created_by  || '',
      });
    } else {
      setForm({
        title:       '',
        description: '',
        priority:    'medium',
        status:      'open',
        created_by:  getLoggedInUsername(),
      });
    }
    setErrors({});
  }, [editingTicket, isOpen]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  // ── Handle input changes ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Handle submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // ── Shared input style ──────────────────────────────────────────────────────
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e2e2',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    fontSize: '16px',
    fontFamily: "'Hanken Grotesk', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const errorInputStyle = {
    ...inputStyle,
    border: '1px solid rgba(248,113,113,0.5)',
  };

  return (
    // ── Overlay — click outside to close ──
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      {/* ── Modal panel — stop clicks from closing ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(19,19,19,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(137,207,240,0.15)',
                border: '1px solid rgba(137,207,240,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#89CFF0' }}>
                {isEditing ? 'edit' : 'add_circle'}
              </span>
            </div>
            <div>
              <h2 style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 600, margin: 0 }}>
                {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
              </h2>
              <p style={{ color: '#bfc8cd', fontSize: '13px', margin: 0 }}>
                {isEditing ? 'Update the ticket details below' : 'Fill in the details for your new ticket'}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#bfc8cd',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* ── API error banner ── */}
        {errors.api && (
          <div
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {errors.api}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#bfc8cd', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Printer not working on 3rd floor"
              style={errors.title ? errorInputStyle : inputStyle}
              onFocus={e => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 12px rgba(137,207,240,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = errors.title ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.title && (
              <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {errors.title}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#bfc8cd', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows={4}
              style={{
                ...( errors.description ? errorInputStyle : inputStyle ),
                resize: 'vertical',
                lineHeight: '1.5',
              }}
              onFocus={e => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 12px rgba(137,207,240,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = errors.description ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.description && (
              <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {errors.description}
              </span>
            )}
          </div>

          {/* Priority + Status side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#bfc8cd', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 12px rgba(137,207,240,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="low"    style={{ background: '#1f1f1f' }}>🟢 Low</option>
                <option value="medium" style={{ background: '#1f1f1f' }}>🟡 Medium</option>
                <option value="high"   style={{ background: '#1f1f1f' }}>🔴 High</option>
              </select>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#bfc8cd', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 12px rgba(137,207,240,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              >
                <option value="open"        style={{ background: '#1f1f1f' }}>🔵 Open</option>
                <option value="in_progress" style={{ background: '#1f1f1f' }}>🟣 In Progress</option>
                <option value="closed"      style={{ background: '#1f1f1f' }}>⚫ Closed</option>
              </select>
            </div>
          </div>

          {/* Created By — read-only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#bfc8cd', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Created By
            </label>
            <div
              style={{
                ...inputStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: 0.6,
                cursor: 'not-allowed',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#89CFF0' }}>account_circle</span>
              <span style={{ color: '#bfc8cd' }}>{form.created_by}</span>
            </div>
          </div>

          {/* ── Footer: Cancel + Submit ── */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 20px',
                color: '#bfc8cd',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Hanken Grotesk', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(137,207,240,0.5)' : '#89CFF0',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                color: '#003546',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Hanken Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isEditing ? 'save' : 'add_circle'}
              </span>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default TicketModal;