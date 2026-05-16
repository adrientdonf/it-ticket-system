import React, { useState } from 'react';
import api from '../services/api';
import './ProfilePage.css';

// ── ProfilePage ───────────────────────────────────────────────────────────────
// Shows the logged-in user's account info, their tickets, and a form to
// change their password.
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePage({ currentUser, tickets, onBack }) {
  // ── Change Password State ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirm,         setConfirm]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState('');
  const [error,           setError]           = useState('');

  // ── Filter user's own tickets ───────────────────────────────────────────────
  // Show only tickets created by the logged-in user
  const myTickets = tickets.filter(
    (t) => t.created_by?.toLowerCase() === currentUser.username?.toLowerCase()
  );

  // ── Handle Password Change ──────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Priority + Status colors ────────────────────────────────────────────────
  const priorityColor = { low: '#10b981', medium: '#d97706', high: '#ef4444' };
  const statusColor   = { open: '#3b82f6', in_progress: '#8b5cf6', closed: '#6b7280' };
  const statusBg      = { open: '#dbeafe', in_progress: '#ede9fe', closed: '#f3f4f6' };
  const priorityBg    = { low: '#d1fae5', medium: '#fef3c7', high: '#fee2e2' };

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <button className="profile-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1 className="profile-title">My Profile</h1>
      </div>

      <div className="profile-grid">

        {/* ── Left Column ── */}
        <div className="profile-left">

          {/* Account Info Card */}
          <div className="profile-card">
            <div className="profile-avatar">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name">{currentUser.username}</h2>
            <span className={`profile-role profile-role--${currentUser.role}`}>
              {currentUser.role}
            </span>

            <div className="profile-info">
              <div className="profile-info__row">
                <span className="profile-info__label">Email</span>
                <span className="profile-info__value">{currentUser.email}</span>
              </div>
              <div className="profile-info__row">
                <span className="profile-info__label">Role</span>
                <span className="profile-info__value">{currentUser.role}</span>
              </div>
              <div className="profile-info__row">
                <span className="profile-info__label">Tickets</span>
                <span className="profile-info__value">{myTickets.length} created</span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="profile-card">
            <h3 className="profile-card__title">Change Password</h3>

            {success && <div className="profile-success">✅ {success}</div>}
            {error   && <div className="profile-error">⚠️ {error}</div>}

            <form onSubmit={handlePasswordChange} className="profile-form">
              <div className="profile-field">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="profile-field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="profile-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="profile-btn" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* ── Right Column: My Tickets ── */}
        <div className="profile-right">
          <div className="profile-card">
            <h3 className="profile-card__title">
              My Tickets
              <span className="profile-ticket-count">{myTickets.length}</span>
            </h3>

            {myTickets.length === 0 ? (
              <div className="profile-empty">
                <span>📭</span>
                <p>You haven't created any tickets yet.</p>
              </div>
            ) : (
              <div className="profile-tickets">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="profile-ticket">
                    <div className="profile-ticket__top">
                      <span className="profile-ticket__id">#{ticket.id}</span>
                      <div className="profile-ticket__badges">
                        <span className="badge" style={{
                          color: priorityColor[ticket.priority],
                          background: priorityBg[ticket.priority],
                        }}>
                          {ticket.priority}
                        </span>
                        <span className="badge" style={{
                          color: statusColor[ticket.status],
                          background: statusBg[ticket.status],
                        }}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                    <p className="profile-ticket__title">{ticket.title}</p>
                    <p className="profile-ticket__desc">{ticket.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;