import React, { useState } from 'react';
import api from '../services/api';

function ProfilePage({ currentUser, tickets, onBack }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirm,         setConfirm]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState('');
  const [error,           setError]           = useState('');

  const myTickets = tickets.filter(
    (t) => t.created_by?.toLowerCase() === currentUser.username?.toLowerCase()
  );

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirm) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 6)  { setError('New password must be at least 6 characters.'); return; }
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

  const priorityStyles = {
    low:    { badge: 'bg-green-500/10 text-green-400 border border-green-500/20',  bar: 'bg-green-400' },
    medium: { badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', bar: 'bg-yellow-400' },
    high:   { badge: 'bg-red-500/10 text-red-400 border border-red-500/20',       bar: 'bg-red-400' },
  };
  const statusStyles = {
    open:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    in_progress: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    closed:      'bg-white/5 text-on-surface-variant border border-white/10',
  };

  const openCount       = myTickets.filter(t => t.status === 'open').length;
  const inProgressCount = myTickets.filter(t => t.status === 'in_progress').length;
  const closedCount     = myTickets.filter(t => t.status === 'closed').length;

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
          <h1 className="font-headline-lg text-headline-lg text-on-surface">My Profile</h1>
          <p className="text-on-surface-variant text-body-sm">Manage your account and security settings</p>
        </div>
        <div className="flex items-center gap-sm px-md py-xs rounded-full border"
          style={{ background: 'rgba(137,207,240,0.08)', borderColor: 'rgba(137,207,240,0.2)' }}>
          <span className="text-primary text-body-sm font-bold uppercase tracking-wider">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* ── Top Row: Avatar Card + Account Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

        {/* Avatar Card */}
        <div className="glass-card rounded-xl p-xl flex flex-col items-center justify-center text-center gap-md">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-on-primary"
              style={{
                background: 'linear-gradient(135deg, #89CFF0, #005974)',
                boxShadow: '0 0 30px rgba(137,207,240,0.3)',
              }}>
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-black"
              style={{ background: '#89CFF0' }}>
              <span className="material-symbols-outlined text-[14px] text-on-primary">edit</span>
            </div>
          </div>
          <div>
            <h2 className="font-title-md text-title-md text-primary">{currentUser.username}</h2>
            <p className="text-on-surface-variant text-body-sm">{currentUser.email}</p>
          </div>
          {/* Stats Row */}
          <div className="w-full grid grid-cols-3 gap-sm pt-md border-t border-white/10">
            {[
              { label: 'Open',        value: openCount,       color: 'text-blue-400' },
              { label: 'In Progress', value: inProgressCount, color: 'text-purple-400' },
              { label: 'Closed',      value: closedCount,     color: 'text-on-surface-variant' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-xs">
                <span className={`font-bold text-title-md ${color}`}>{value}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider leading-tight text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2 glass-card rounded-xl p-xl">
          <h3 className="font-title-md text-title-md text-primary mb-xl flex items-center gap-sm">
            <span className="material-symbols-outlined">badge</span>
            Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            {[
              { label: 'Username',     value: currentUser.username },
              { label: 'Email Address', value: currentUser.email },
              { label: 'Role',          value: currentUser.role },
              { label: 'Total Tickets', value: `${myTickets.length} created` },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-xs">
                <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider">
                  {label}
                </label>
                <div className="text-body-lg text-on-surface capitalize">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row: My Tickets + Security Settings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

        {/* My Tickets */}
        <div className="lg:col-span-2 glass-card rounded-xl p-xl flex flex-col">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">My Tickets</h3>
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              {myTickets.length} TOTAL
            </span>
          </div>

          {myTickets.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-md py-xl text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">confirmation_number</span>
              <p className="text-on-surface-variant text-body-sm">You haven't created any tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-md flex-grow overflow-y-auto" style={{ maxHeight: '420px' }}>
              {myTickets.map((ticket) => {
                const ps = priorityStyles[ticket.priority] || priorityStyles.low;
                const ss = statusStyles[ticket.status]    || statusStyles.closed;
                return (
                  <div key={ticket.id}
                    className="flex gap-md p-md rounded-lg border border-white/5 hover:border-primary/20 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {/* Accent bar */}
                    <div className={`w-[3px] rounded-full flex-shrink-0 ${ps.bar}`} />
                    <div className="flex-grow space-y-xs">
                      <div className="flex justify-between items-start">
                        <span className="text-label-caps font-label-caps text-primary">#{ticket.id}</span>
                        <div className="flex gap-xs">
                          <span className={`px-sm py-xs rounded text-[10px] font-bold ${ps.badge}`}>
                            {ticket.priority?.toUpperCase()}
                          </span>
                          <span className={`px-sm py-xs rounded text-[10px] font-bold ${ss}`}>
                            {ticket.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="font-title-md text-title-md text-on-surface">{ticket.title}</p>
                      {ticket.description && (
                        <p className="text-body-sm text-on-surface-variant line-clamp-1">{ticket.description}</p>
                      )}
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="glass-card rounded-xl p-xl">
          <h3 className="font-title-md text-title-md text-primary mb-xl flex items-center gap-sm">
            <span className="material-symbols-outlined">lock</span>
            Security Settings
          </h3>

          {success && (
            <div className="mb-lg px-md py-sm rounded-lg text-body-sm font-bold flex items-center gap-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {success}
            </div>
          )}
          {error && (
            <div className="mb-lg px-md py-sm rounded-lg text-body-sm font-bold flex items-center gap-sm"
              style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.2)', color: '#ffb4ab' }}>
              <span className="material-symbols-outlined text-[18px]">warning</span>
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-lg">
            {[
              { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, placeholder: '••••••••' },
              { label: 'New Password',     value: newPassword,     setter: setNewPassword,     placeholder: '••••••••' },
              { label: 'Confirm Password', value: confirm,         setter: setConfirm,         placeholder: '••••••••' },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label} className="space-y-sm">
                <label className="text-label-caps font-label-caps text-on-surface-variant uppercase">
                  {label}
                </label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  required
                  className="w-full rounded-lg px-md py-sm text-on-surface text-body-lg focus:outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#89CFF0';
                    e.target.style.boxShadow = '0 0 15px rgba(137,207,240,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            ))}

            <div className="pt-md">
              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-md rounded-lg transition-all border border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;