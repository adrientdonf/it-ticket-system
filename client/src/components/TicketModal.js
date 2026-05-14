import React, { useState, useEffect } from 'react';

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'open',
  created_by: '',
};

function TicketModal({ isOpen, onClose, onSubmit, editingTicket }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(editingTicket);

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
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingTicket, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.created_by.trim())  e.created_by  = 'Created by is required';
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{isEditing ? 'Edit Ticket' : 'Create New Ticket'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          {errors.api && <div className="form-error form-error--banner">{errors.api}</div>}

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

          <div className="form-group">
            <label>Created By</label>
            <input
              name="created_by"
              value={form.created_by}
              onChange={handleChange}
              placeholder="Your name"
              className={errors.created_by ? 'input--error' : ''}
            />
            {errors.created_by && <span className="form-error">{errors.created_by}</span>}
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