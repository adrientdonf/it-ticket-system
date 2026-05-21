import React, { useState } from 'react';
import api from '../services/api';
import { uploadAvatar } from '../services/api';

function ProfilePage({ currentUser, tickets, onBack, onSelectTicket }) {

  // ── Password form state ─────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirm,         setConfirm]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState('');
  const [error,           setError]           = useState('');

  // ── Avatar state ────────────────────────────────────────────────────────────
  // Initialise from currentUser.avatar_url (set after DB fetch) or null
  const [avatarUrl,     setAvatarUrl]     = useState(currentUser.avatar_url || null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ── Filter tickets belonging to this user ───────────────────────────────────
  const myTickets = tickets.filter(
    (t) => t.created_by?.toLowerCase() === currentUser.username?.toLowerCase()
  );

  // ── Password change handler ─────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirm) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Avatar upload handler ───────────────────────────────────────────────────
  // Reads the selected file as base64, sends it to the backend,
  // which uploads it to Cloudinary and saves the URL in the DB.
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setAvatarLoading(true);
        const res = await uploadAvatar(reader.result);
        const newUrl = res.data.avatarUrl;
        // Update local state so avatar updates immediately
        setAvatarUrl(newUrl);
        // Persist to localStorage so the header avatar updates too
        const stored = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...stored, avatar_url: newUrl }));
      } catch (err) {
        setError('Failed to upload photo.');
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Priority + status color maps ────────────────────────────────────────────
  const priorityColor = {
    low:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)',   bar: '#4ade80' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',   bar: '#fbbf24' },
    high:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)',  bar: '#f87171' },
  };
  const statusColor = {
    open:        { color: '#89CFF0', bg: 'rgba(137,207,240,0.1)', border: 'rgba(137,207,240,0.25)' },
    in_progress: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)' },
    closed:      { color: '#899297', bg: 'rgba(137,146,151,0.1)', border: 'rgba(137,146,151,0.2)'  },
  };

  // ── Ticket stat counts ──────────────────────────────────────────────────────
  const openCount       = myTickets.filter(t => t.status === 'open').length;
  const inProgressCount = myTickets.filter(t => t.status === 'in_progress').length;
  const closedCount     = myTickets.filter(t => t.status === 'closed').length;

  // ── Shared styles ───────────────────────────────────────────────────────────
  const glass = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#e2e2e2',
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'Hanken Grotesk', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#899297',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '8px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      fontFamily: "'Hanken Grotesk', sans-serif",
    }}>

      {/* ── Sticky top header bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '68px',
        background: 'rgba(19,19,19,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        gap: '16px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: '#89CFF0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#003546', fontSize: '20px' }}>terminal</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#bce8ff', letterSpacing: '-0.02em' }}>
            TicketDesk
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '8px 16px',
            color: '#bfc8cd', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(137,207,240,0.1)'; e.currentTarget.style.color = '#89CFF0'; e.currentTarget.style.borderColor = 'rgba(137,207,240,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#bfc8cd'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Dashboard
        </button>

        {/* Right: page title + role badge */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e2e2' }}>My Profile</span>
          <span style={{
            background: 'rgba(137,207,240,0.1)', border: '1px solid rgba(137,207,240,0.25)',
            borderRadius: '999px', padding: '3px 12px',
            color: '#89CFF0', fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {currentUser.role}
          </span>
        </div>
      </header>

      {/* ── Page content ── */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '40px 40px 60px',
        display: 'flex', flexDirection: 'column', gap: '24px',
      }}>

        {/* ── Row 1: Avatar card + Account details ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>

          {/* Avatar card */}
          <div style={{ ...glass, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>

            {/* Avatar circle — shows photo if uploaded, otherwise initial letter */}
            <div style={{ position: 'relative' }}>
              {avatarUrl ? (
                // ── Photo avatar ──
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: '0 0 32px rgba(137,207,240,0.3)',
                    border: '2px solid rgba(137,207,240,0.3)',
                  }}
                />
              ) : (
                // ── Initial letter fallback ──
                <div style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #89CFF0, #005974)',
                  boxShadow: '0 0 32px rgba(137,207,240,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '36px', fontWeight: 700, color: '#003546',
                }}>
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Edit button — clicking triggers the hidden file input */}
              <label
                htmlFor="avatar-upload"
                title="Upload photo"
                style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: avatarLoading ? '#899297' : '#89CFF0',
                  border: '2px solid #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: avatarLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#003546' }}>
                  {avatarLoading ? 'hourglass_empty' : 'edit'}
                </span>
              </label>

              {/* Hidden file input — only accepts images */}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Username + email */}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#89CFF0' }}>{currentUser.username}</div>
              <div style={{ fontSize: '13px', color: '#899297', marginTop: '4px' }}>{currentUser.email}</div>
            </div>

            {/* Upload hint text */}
            <p style={{ fontSize: '11px', color: '#899297', margin: '-8px 0 0', lineHeight: 1.4 }}>
              Click the pencil icon to upload a photo
            </p>

            {/* Ticket stats row */}
            <div style={{
              width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
              {[
                { label: 'Open',    value: openCount,       color: '#89CFF0' },
                { label: 'In Prog', value: inProgressCount, color: '#c084fc' },
                { label: 'Closed',  value: closedCount,     color: '#899297' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</span>
                  <span style={{ fontSize: '10px', color: '#899297', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2, textAlign: 'center' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account details card */}
          <div style={{ ...glass, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>badge</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e2e2' }}>Account Details</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              {[
                { label: 'Username',      value: currentUser.username },
                { label: 'Email Address', value: currentUser.email },
                { label: 'Role',          value: currentUser.role },
                { label: 'Total Tickets', value: `${myTickets.length} created` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{
                    fontSize: '15px', color: '#e2e2e2',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px', padding: '10px 14px',
                    textTransform: label === 'Role' ? 'capitalize' : 'none',
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: My tickets + Security settings ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* My tickets list */}
          <div style={{ ...glass, padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>confirmation_number</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e2e2' }}>My Tickets</span>
              </div>
              <span style={{ fontSize: '11px', color: '#899297', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {myTickets.length} total
              </span>
            </div>

            {myTickets.length === 0 ? (
              <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#899297', opacity: 0.4 }}>inbox</span>
                <p style={{ color: '#899297', fontSize: '13px', margin: 0 }}>You haven't created any tickets yet.</p>
              </div>
            ) : (
              // Scrollable ticket list — clicking a row navigates to that ticket in the dashboard
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {myTickets.map((ticket) => {
                  const pc = priorityColor[ticket.priority] || priorityColor.low;
                  const sc = statusColor[ticket.status]     || statusColor.closed;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => onSelectTicket && onSelectTicket(ticket)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: onSelectTicket ? 'pointer' : 'default',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(137,207,240,0.05)'; e.currentTarget.style.borderColor = 'rgba(137,207,240,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                    >
                      {/* Priority accent bar */}
                      <div style={{ width: '3px', borderRadius: '999px', alignSelf: 'stretch', background: pc.bar, flexShrink: 0 }} />

                      {/* Ticket info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#89CFF0', fontWeight: 700 }}>#{ticket.id}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {ticket.priority}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e2e2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ticket.title}
                        </div>
                        {ticket.description && (
                          <div style={{ fontSize: '12px', color: '#899297', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ticket.description}
                          </div>
                        )}
                      </div>

                      {/* Chevron arrow */}
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#899297', flexShrink: 0 }}>chevron_right</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security settings — change password form */}
          <div style={{ ...glass, padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>lock</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e2e2' }}>Security Settings</span>
            </div>

            {/* Success banner */}
            {success && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                {success}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', color: '#ffb4ab' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Current Password', value: currentPassword, setter: setCurrentPassword },
                { label: 'New Password',     value: newPassword,     setter: setNewPassword     },
                { label: 'Confirm Password', value: confirm,         setter: setConfirm         },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 14px rgba(137,207,240,0.15)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px', width: '100%', padding: '11px',
                  borderRadius: '10px', background: 'transparent',
                  border: '1px solid rgba(137,207,240,0.35)',
                  color: '#89CFF0', fontSize: '13px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                  opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(137,207,240,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {loading ? 'Updating…' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProfilePage;