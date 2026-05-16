import React, { useState, useEffect } from 'react';

// ── TicketModal ───────────────────────────────────────────────────────────────
// Used for both creating and editing tickets.
// When creating, auto-fills created_by from the logged-in user in localStorage.
// When editing, pre-fills all fields from the existing ticket.
// ─────────────────────────────────────────────────────────────────────────────

// Get the logged-in user's username from localStorage once at module level.
// This is the user saved during login/register.
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

  // ── Form State ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:       '',
    description: '',
    priority:    'medium',
    status:      'open',
    // Auto-fill created_by with the logged-in username on creation
    created_by:  getLoggedInUsername(),
  });

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // ── Populate form when modal opens ──────────────────────────────────────────
  // If editing, fill in the existing ticket's values.
  // If creating, reset the form and auto-fill created_by again.
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
        created_by:  getLoggedInUsername(), // always auto-fill on new ticket
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

  // ── Handle Input Changes ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Handle Submit ───────────────────────────────────────────────────────────
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

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Stop clicks inside the modal from closing it */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal__header">
          <h2>{isEditing ? 'Edit Ticket' : 'Create New Ticket'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">

          {/* API error banner */}
          {errors.api && (
            <div className="form-error form-error--banner">{errors.api}</div>
          )}

          {/* Title */}
          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Printer not working on 3rd floor"
              className={errors.title ? 'input--error' : ''}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows={3}
              className={errors.description ? 'input--error' : ''}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          {/* Priority + Status side by side */}
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Created By — read-only, auto-filled from logged-in user */}
          <div className="form-group">
            <label>Created By</label>
            <input
              name="created_by"
              value={form.created_by}
              readOnly
              style={{ opacity: 0.6, cursor: 'not-allowed', background: '#f9fafb' }}
            />
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default TicketModal;