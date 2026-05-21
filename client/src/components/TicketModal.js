import React, { useState, useEffect } from 'react';

const getLoggedInUsername = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.username || '';
  } catch {
    return '';
  }
};

// ── Pill selector config ────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)'  },
  { value: 'medium', label: 'Medium', color: '#facc15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)'  },
  { value: 'high',   label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
];

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open',        color: '#89CFF0', bg: 'rgba(137,207,240,0.12)', border: 'rgba(137,207,240,0.3)' },
  { value: 'in_progress', label: 'In Progress', color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)' },
  { value: 'closed',      label: 'Closed',      color: '#899297', bg: 'rgba(137,146,151,0.12)', border: 'rgba(137,146,151,0.3)' },
];

// ── PillGroup ────────────────────────────────────────────────────────────────
const PillGroup = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '7px 16px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Hanken Grotesk', sans-serif",
            transition: 'all 0.18s',
            background:   active ? opt.bg     : 'rgba(255,255,255,0.03)',
            border:       active ? `1px solid ${opt.border}` : '1px solid rgba(255,255,255,0.08)',
            color:        active ? opt.color  : '#899297',
            boxShadow:    active ? `0 0 10px ${opt.bg}` : 'none',
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ── TicketModal ──────────────────────────────────────────────────────────────
function TicketModal({ isOpen, onClose, onSubmit, editingTicket }) {
  const isEditing = Boolean(editingTicket);

  const [form, setForm] = useState({
    title:       '',
    description: '',
    priority:    'medium',
    status:      'open',
    created_by:  getLoggedInUsername(),
  });

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

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

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

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

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e2e2',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
    fontFamily: "'Hanken Grotesk', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#bfc8cd',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(19,19,19,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '540px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(137,207,240,0.12)',
              border: '1px solid rgba(137,207,240,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#89CFF0' }}>
                {isEditing ? 'edit' : 'confirmation_number'}
              </span>
            </div>
            <div>
              <h2 style={{ color: '#e2e2e2', fontSize: '17px', fontWeight: 700, margin: 0 }}>
                {isEditing ? 'Edit Ticket' : 'New Ticket'}
              </h2>
              <p style={{ color: '#899297', fontSize: '12px', margin: 0, marginTop: '2px' }}>
                {isEditing ? 'Update the ticket details below' : 'Fill in the details for your new ticket'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#bfc8cd',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '-12px 0' }} />

        {/* ── API Error ── */}
        {errors.api && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '10px', padding: '12px 14px',
            color: '#f87171', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {errors.api}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Printer not working on 3rd floor"
              style={{ ...inputStyle, border: errors.title ? '1px solid rgba(248,113,113,0.5)' : inputStyle.border }}
              onFocus={e  => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 14px rgba(137,207,240,0.15)'; }}
              onBlur={e   => { e.target.style.borderColor = errors.title ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.title && (
              <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>error</span>
                {errors.title}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows={4}
              style={{
                ...inputStyle,
                border: errors.description ? '1px solid rgba(248,113,113,0.5)' : inputStyle.border,
                resize: 'vertical',
                lineHeight: '1.6',
              }}
              onFocus={e  => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 14px rgba(137,207,240,0.15)'; }}
              onBlur={e   => { e.target.style.borderColor = errors.description ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.description && (
              <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>error</span>
                {errors.description}
              </span>
            )}
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={labelStyle}>Priority</label>
            <PillGroup
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(val) => setForm((prev) => ({ ...prev, priority: val }))}
            />
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={labelStyle}>Status</label>
            <PillGroup
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
            />
          </div>

          {/* Created By — read-only */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Created By</label>
            <div style={{
              ...inputStyle,
              display: 'flex', alignItems: 'center', gap: '8px',
              opacity: 0.55, cursor: 'not-allowed',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#89CFF0' }}>account_circle</span>
              <span style={{ color: '#bfc8cd', fontSize: '14px' }}>{form.created_by}</span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '10px 20px',
                color: '#bfc8cd', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif",
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
                background: loading ? 'rgba(137,207,240,0.4)' : '#89CFF0',
                border: 'none', borderRadius: '10px',
                padding: '10px 24px', color: '#003546',
                fontSize: '13px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Hanken Grotesk', sans-serif",
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isEditing ? 'save' : 'confirmation_number'}
              </span>
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default TicketModal;