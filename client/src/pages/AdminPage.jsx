import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminPage.css';

// ── AdminPage ─────────────────────────────────────────────────────────────────
// Only accessible to users with role = 'admin'.
// Shows all users with options to change their role or delete them.
// ─────────────────────────────────────────────────────────────────────────────

function AdminPage({ currentUser, onBack }) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [message, setMessage] = useState('');

  // ── Fetch All Users ─────────────────────────────────────────────────────────
  // Calls GET /api/admin/users — only works if logged in as admin
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Change User Role ────────────────────────────────────────────────────────
  // Toggles a user between 'admin' and 'employee'
  const handleRoleChange = async (user) => {
    const newRole = user.role === 'admin' ? 'employee' : 'admin';
    if (!window.confirm(`Change ${user.username}'s role to ${newRole}?`)) return;

    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setMessage(`✅ ${user.username}'s role updated to ${newRole}.`);
      fetchUsers(); // refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  // ── Delete User ─────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.username}? This cannot be undone.`)) return;

    try {
      await api.delete(`/admin/users/${user.id}`);
      setMessage(`✅ ${user.username} has been deleted.`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  return (
    <div className="admin-page">

      {/* ── Header ── */}
      <div className="admin-header">
        <button className="admin-back" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <div className="admin-header__top">
          <h1 className="admin-title">Admin Panel</h1>
          <span className="admin-badge">🛡️ Admin Only</span>
        </div>
        <p className="admin-subtitle">Manage all users, roles, and accounts.</p>
      </div>

      {/* ── Messages ── */}
      {message && <div className="admin-success">{message}</div>}
      {error   && <div className="admin-error">⚠️ {error}</div>}

      {/* ── Stats Bar ── */}
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__number">{users.length}</span>
          <span className="admin-stat__label">Total Users</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__number">
            {users.filter((u) => u.role === 'admin').length}
          </span>
          <span className="admin-stat__label">Admins</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__number">
            {users.filter((u) => u.role === 'employee').length}
          </span>
          <span className="admin-stat__label">Employees</span>
        </div>
      </div>

      {/* ── User Table ── */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                // Can't modify yourself
                const isSelf = user.id === currentUser.id;

                return (
                  <tr key={user.id} className={isSelf ? 'admin-table__row--self' : ''}>

                    {/* Username + self indicator */}
                    <td>
                      <div className="admin-user">
                        <div className="admin-user__avatar">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="admin-user__name">{user.username}</span>
                          {isSelf && <span className="admin-user__you">You</span>}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="admin-email">{user.email}</td>

                    {/* Role badge */}
                    <td>
                      <span className={`admin-role admin-role--${user.role}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Join date */}
                    <td className="admin-date">{formatDate(user.created_at)}</td>

                    {/* Actions */}
                    <td>
                      {isSelf ? (
                        <span className="admin-no-action">—</span>
                      ) : (
                        <div className="admin-actions">
                          <button
                            className="admin-btn admin-btn--role"
                            onClick={() => handleRoleChange(user)}
                          >
                            {user.role === 'admin' ? 'Make Employee' : 'Make Admin'}
                          </button>
                          <button
                            className="admin-btn admin-btn--delete"
                            onClick={() => handleDelete(user)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default AdminPage;