import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getResetRequests, resolveResetRequest } from '../services/api';

function AdminPage({ currentUser, onBack }) {
  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [message,        setMessage]        = useState('');
  const [search,         setSearch]         = useState('');

  // ── Reset request state ─────────────────────────────────────────────────────
  const [resetRequests,  setResetRequests]  = useState([]);
  const [showResets,     setShowResets]     = useState(false);

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

  // ── Fetch pending password reset requests ───────────────────────────────────
  const fetchResetRequests = async () => {
    try {
      const res = await getResetRequests();
      setResetRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load reset requests:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchResetRequests();
  }, []);

  const handleRoleChange = async (user) => {
    const newRole = user.role === 'admin' ? 'employee' : 'admin';
    if (!window.confirm(`Change ${user.username}'s role to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setMessage(`${user.username}'s role updated to ${newRole}.`);
      setError('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
      setMessage('');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setMessage(`${user.username} has been deleted.`);
      setError('');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setMessage('');
    }
  };

  // ── Resolve a password reset request ────────────────────────────────────────
  // Sets the user's password to temp1234 and marks the request as resolved
  const handleResolveReset = async (request) => {
    if (!window.confirm(`Reset ${request.username}'s password to temp1234?`)) return;
    try {
      await resolveResetRequest(request.id);
      setMessage(`${request.username}'s password has been reset to temp1234.`);
      setError('');
      fetchResetRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
      setMessage('');
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount    = users.filter((u) => u.role === 'admin').length;
  const employeeCount = users.filter((u) => u.role === 'employee').length;

  return (
    <div className="space-y-gutter">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors text-body-sm mb-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">User Management</h1>
          <p className="text-on-surface-variant text-body-sm">Manage system access levels and operational permissions.</p>
        </div>
        <div className="flex items-center gap-sm">

          {/* ── Reset Requests Bell ── */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowResets(!showResets)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: resetRequests.length > 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${resetRequests.length > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px', padding: '8px 14px',
                color: resetRequests.length > 0 ? '#fbbf24' : '#899297',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Hanken Grotesk', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
              Reset Requests
              {resetRequests.length > 0 && (
                <span style={{
                  background: '#fbbf24', color: '#000',
                  borderRadius: '999px', fontSize: '11px', fontWeight: 800,
                  padding: '1px 7px', marginLeft: '2px',
                }}>
                  {resetRequests.length}
                </span>
              )}
            </button>

            {/* ── Reset Requests Dropdown ── */}
            {showResets && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '340px', zIndex: 100,
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '13px', fontWeight: 700, color: '#e2e2e2',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbbf24' }}>lock_reset</span>
                  Pending Password Resets
                </div>

                {resetRequests.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#899297', fontSize: '13px' }}>
                    No pending reset requests
                  </div>
                ) : (
                  resetRequests.map((req) => (
                    <div key={req.id} style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e2e2' }}>{req.username}</div>
                        <div style={{ fontSize: '11px', color: '#899297', marginTop: '2px' }}>{req.email}</div>
                        <div style={{ fontSize: '10px', color: '#899297', marginTop: '2px' }}>{formatDate(req.created_at)}</div>
                      </div>
                      <button
                        onClick={() => handleResolveReset(req)}
                        style={{
                          background: '#89CFF0', color: '#003546',
                          border: 'none', borderRadius: '8px',
                          padding: '6px 12px', fontSize: '12px', fontWeight: 700,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                          fontFamily: "'Hanken Grotesk', sans-serif",
                        }}
                      >
                        Reset Password
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Admin Only badge */}
          <div className="flex items-center gap-sm px-md py-xs rounded-full border"
            style={{ background: 'rgba(255,180,171,0.08)', borderColor: 'rgba(255,180,171,0.2)' }}>
            <span className="material-symbols-outlined text-[16px] text-error">shield</span>
            <span className="text-error text-body-sm font-bold uppercase tracking-wider">Admin Only</span>
          </div>
        </div>
      </div>

      {/* ── Feedback Messages ── */}
      {message && (
        <div className="px-md py-sm rounded-lg text-body-sm font-bold flex items-center gap-sm"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {message}
        </div>
      )}
      {error && (
        <div className="px-md py-sm rounded-lg text-body-sm font-bold flex items-center gap-sm"
          style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', color: '#ffb4ab' }}>
          <span className="material-symbols-outlined text-[18px]">warning</span>
          {error}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-gutter">
        {[
          { label: 'Total Users', value: users.length,   icon: 'group',               color: 'text-primary' },
          { label: 'Admins',      value: adminCount,     icon: 'admin_panel_settings', color: 'text-yellow-400' },
          { label: 'Employees',   value: employeeCount,  icon: 'badge',               color: 'text-blue-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-lg flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            </div>
            <div>
              <div className={`font-bold text-title-md ${color}`}>{value}</div>
              <div className="text-on-surface-variant text-[10px] uppercase tracking-wider">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── User Directory Table ── */}
      <div className="glass-card rounded-xl overflow-hidden">

        {/* Search Bar */}
        <div className="p-lg border-b flex items-center gap-md" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg pl-10 pr-md py-sm text-on-surface text-body-sm focus:outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#89CFF0';
                e.target.style.boxShadow = '0 0 15px rgba(137,207,240,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <span className="text-on-surface-variant text-body-sm">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-md py-xl text-on-surface-variant">
            <div className="spinner" />
            <p className="text-body-sm">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'rgba(137,207,240,0.03)' }}>
                  {['Username', 'Email', 'Role', 'Joined', 'Actions'].map((h, i) => (
                    <th key={h}
                      className={`px-lg py-md font-title-md text-primary text-body-sm ${i === 4 ? 'text-right' : 'text-left'}`}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-xl text-on-surface-variant text-body-sm">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    return (
                      <tr key={user.id}
                        className="group transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                        {/* Username */}
                        <td className="px-lg py-lg">
                          <div className="flex items-center gap-md">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{
                                background: isSelf ? 'rgba(137,207,240,0.15)' : 'rgba(255,255,255,0.05)',
                                border: isSelf ? '1px solid rgba(137,207,240,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                color: isSelf ? '#89CFF0' : '#bfc8cd',
                              }}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-on-surface font-bold text-body-sm">{user.username}</span>
                              {isSelf && (
                                <span className="ml-sm px-xs py-[1px] rounded text-[9px] font-bold uppercase"
                                  style={{ background: 'rgba(137,207,240,0.1)', color: '#89CFF0', border: '1px solid rgba(137,207,240,0.2)' }}>
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-lg py-lg text-on-surface-variant text-body-sm">{user.email}</td>

                        {/* Role */}
                        <td className="px-lg py-lg">
                          <span className={`px-sm py-xs rounded text-[10px] font-bold border ${
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-white/5 text-on-surface-variant border-white/10'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Employee'}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-lg py-lg text-on-surface-variant text-body-sm">
                          {formatDate(user.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-lg py-lg text-right">
                          {isSelf ? (
                            <span className="text-on-surface-variant text-body-sm">—</span>
                          ) : (
                            <div className="flex justify-end gap-sm">
                              <button
                                onClick={() => handleRoleChange(user)}
                                className="px-md py-xs rounded text-body-sm font-bold transition-all hover:brightness-110 active:scale-95"
                                style={{ background: '#89CFF0', color: '#003546' }}>
                                {user.role === 'admin' ? 'Make Employee' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDelete(user)}
                                className="px-md py-xs rounded text-body-sm font-bold transition-all hover:bg-error/10 active:scale-95"
                                style={{ border: '1px solid rgba(255,180,171,0.4)', color: '#ffb4ab' }}>
                                Delete
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {!loading && (
          <div className="px-lg py-md flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
            <span className="text-on-surface-variant text-body-sm">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPage;