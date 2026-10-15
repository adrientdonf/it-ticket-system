import React, { useState, useEffect, useCallback } from 'react';
import TicketCard from './components/TicketCard';
import TicketModal from './components/TicketModal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CommentSection from './components/CommentSection';
import { getTickets, createTicket, updateTicket, deleteTicket } from './services/api';
import './App.css';

const FILTERS = ['all', 'open', 'in_progress', 'closed'];

// ── Theme token maps ────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    '--bg-base':           '#0d0d0d',
    '--bg-surface':        'rgba(255,255,255,0.03)',
    '--bg-header':         'rgba(19,19,19,0.90)',
    '--bg-sidebar':        'rgba(31,31,31,0.55)',
    '--bg-input':          'rgba(255,255,255,0.04)',
    '--bg-hover':          'rgba(255,255,255,0.05)',
    '--bg-notif':          'rgba(19,19,19,0.97)',
    '--border-subtle':     'rgba(255,255,255,0.08)',
    '--border-input':      'rgba(255,255,255,0.10)',
    '--border-divider':    'rgba(255,255,255,0.05)',
    '--text-primary':      '#e2e2e2',
    '--text-secondary':    '#bfc8cd',
    '--text-muted':        '#899297',
    '--text-heading':      '#e2e2e2',
    '--accent':            '#89CFF0',
    '--accent-bg':         'rgba(137,207,240,0.10)',
    '--accent-border':     'rgba(137,207,240,0.25)',
    '--accent-shadow':     'rgba(137,207,240,0.15)',
    '--accent-logo-text':  '#bce8ff',
    '--accent-logo-icon':  '#003546',
    '--accent-logo-bg':    '#89CFF0',
    '--scrollbar-thumb':   'rgba(137,207,240,0.2)',
    '--header-shadow':     '0 0 15px rgba(137,207,240,0.08)',
  },
  light: {
    '--bg-base':           '#f0f2f5',
    '--bg-surface':        'rgba(255,255,255,0.85)',
    '--bg-header':         'rgba(255,255,255,0.92)',
    '--bg-sidebar':        'rgba(248,249,251,0.95)',
    '--bg-input':          'rgba(0,0,0,0.04)',
    '--bg-hover':          'rgba(0,0,0,0.04)',
    '--bg-notif':          'rgba(255,255,255,0.98)',
    '--border-subtle':     'rgba(0,0,0,0.08)',
    '--border-input':      'rgba(0,0,0,0.12)',
    '--border-divider':    'rgba(0,0,0,0.06)',
    '--text-primary':      '#1a2332',
    '--text-secondary':    '#4a5568',
    '--text-muted':        '#718096',
    '--text-heading':      '#1a2332',
    '--accent':            '#0077a8',
    '--accent-bg':         'rgba(0,119,168,0.08)',
    '--accent-border':     'rgba(0,119,168,0.22)',
    '--accent-shadow':     'rgba(0,119,168,0.12)',
    '--accent-logo-text':  '#004d70',
    '--accent-logo-icon':  '#ffffff',
    '--accent-logo-bg':    '#0077a8',
    '--scrollbar-thumb':   'rgba(0,119,168,0.2)',
    '--header-shadow':     '0 1px 12px rgba(0,0,0,0.08)',
  },
};

// ── Inject CSS vars onto <body> ─────────────────────────────────────────────
function applyTheme(mode) {
  const vars = THEMES[mode];
  Object.entries(vars).forEach(([k, v]) => {
    document.body.style.setProperty(k, v);
  });
  document.body.setAttribute('data-theme', mode);
}

function App() {

  // ── Theme State ─────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('td-theme') || 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('td-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  // ── Auth State ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // ── Ticket State ────────────────────────────────────────────────────────────
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editingTicket,  setEditingTicket]  = useState(null);
  const [filter,         setFilter]         = useState('all');
  const [search,         setSearch]         = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ── Navigation State ────────────────────────────────────────────────────────
  const [showRegister,      setShowRegister]      = useState(false);
  const [showProfile,       setShowProfile]       = useState(false);
  const [showAdmin,         setShowAdmin]         = useState(false);
  const [showAnalytics,     setShowAnalytics]     = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds,      setDismissedIds]      = useState([]);

  // ── Fetch Tickets ───────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTickets();
      setTickets(res.data.data || []);
    } catch {
      setError('Failed to load tickets. Is your backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchTickets();
  }, [currentUser, fetchTickets]);

  // ── Auth Handlers ───────────────────────────────────────────────────────────
  const handleLogin  = (user) => setCurrentUser(user);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setCurrentUser(null);
    setTickets([]);
  };

  // ── Ticket Handlers ─────────────────────────────────────────────────────────
  const handleCreate = async (form) => { await createTicket(form); await fetchTickets(); };
  const handleEdit   = async (form) => { await updateTicket(editingTicket.id, form); await fetchTickets(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    await deleteTicket(id);
    await fetchTickets();
    if (selectedTicket?.id === id) setSelectedTicket(null);
  };

  const openCreate = () => { setEditingTicket(null); setModalOpen(true); };
  const openEdit   = (ticket) => { setEditingTicket(ticket); setModalOpen(true); };

  // ── Notifications ───────────────────────────────────────────────────────────
  const allNotifications = tickets
    .slice()
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 8)
    .map((t) => {
      const isOwn = t.created_by?.toLowerCase() === currentUser?.username?.toLowerCase();
      const date  = new Date(t.updated_at || t.created_at);
      const now   = new Date();
      const diff  = Math.floor((now - date) / 1000);
      const time  =
        diff < 60     ? 'just now' :
        diff < 3600   ? `${Math.floor(diff / 60)}m ago` :
        diff < 86400  ? `${Math.floor(diff / 3600)}h ago` :
                        `${Math.floor(diff / 86400)}d ago`;

      if (t.status === 'closed') {
        return { id: t.id, icon: 'check_circle', text: `Ticket #${t.id} "${t.title}" was closed`, time, dot: false };
      } else if (t.status === 'in_progress') {
        return { id: t.id, icon: 'pending', text: `Ticket #${t.id} "${t.title}" is in progress`, time, dot: !isOwn };
      } else {
        return { id: t.id, icon: 'confirmation_number', text: `${isOwn ? 'You opened' : `${t.created_by} opened`} Ticket #${t.id} "${t.title}"`, time, dot: !isOwn };
      }
    })
    .filter((n) => !dismissedIds.includes(n.id));

  const unreadCount = allNotifications.filter((n) => n.dot).length;

  // ── Filter + Search ─────────────────────────────────────────────────────────
  const filtered = tickets.filter((t) => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all:         tickets.length,
    open:        tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    closed:      tickets.filter((t) => t.status === 'closed').length,
  };

  const filterLabel = { all: 'All', open: 'Open', in_progress: 'In Progress', closed: 'Closed' };

  // ── Theme toggle button (reused in header + sidebar) ────────────────────────
  const ThemeToggle = ({ compact = false }) => (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: compact ? '0' : '10px',
        padding: compact ? '8px' : '10px 14px',
        borderRadius: compact ? '50%' : '10px',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        border: `1px solid var(--border-subtle)`,
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        fontSize: '13px', fontWeight: 600,
        fontFamily: "'Hanken Grotesk', sans-serif",
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--accent-bg)';
        e.currentTarget.style.color = 'var(--accent)';
        e.currentTarget.style.borderColor = 'var(--accent-border)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
      {!compact && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );

  // ── Auth Guard ──────────────────────────────────────────────────────────────
  if (!currentUser) {
    if (showRegister) {
      return <RegisterPage onLogin={handleLogin} onGoToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onGoToRegister={() => setShowRegister(true)} />;
  }

  if (showProfile) {
    return (
      <ProfilePage
        currentUser={currentUser}
        tickets={tickets}
        onBack={() => setShowProfile(false)}
        onSelectTicket={(ticket) => { setShowProfile(false); setSelectedTicket(ticket); }}
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
          const inLocal = localStorage.getItem('user');
          const storage = inLocal ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(updatedUser));
        }}
      />
    );
  }

  if (showAdmin && currentUser.role === 'admin') {
    return <AdminPage currentUser={currentUser} onBack={() => setShowAdmin(false)} />;
  }

  if (showAnalytics && currentUser.role === 'admin') {
    return <AnalyticsPage currentUser={currentUser} tickets={tickets} onBack={() => setShowAnalytics(false)} />;
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg-base)',
        fontFamily: "'Hanken Grotesk', sans-serif",
        transition: 'background 0.3s',
      }}
      onClick={() => setShowNotifications(false)}
    >

      {/* ── FIXED TOP HEADER ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '72px',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: 'var(--header-shadow)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
        gap: '24px',
        transition: 'background 0.3s, border-color 0.3s',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--accent-logo-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-logo-icon)', fontSize: '22px' }}>terminal</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-logo-text)', letterSpacing: '-0.02em', margin: 0 }}>
            TicketDesk
          </h1>
        </div>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-secondary)', fontSize: '18px', pointerEvents: 'none',
          }}>search</span>
          <input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '12px',
              padding: '9px 16px 9px 40px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.boxShadow   = '0 0 12px var(--accent-shadow)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border-input)';
              e.target.style.boxShadow   = 'none';
            }}
          />
        </div>

        {/* Right: theme toggle + icons + user */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Theme toggle — compact circle in header */}
          <ThemeToggle compact={true} />

          {/* Notification bell */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <span
              className="material-symbols-outlined"
              style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px', display: 'block', transition: 'color 0.2s' }}
              onClick={() => setShowNotifications(prev => !prev)}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >notifications</span>

            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '1px', right: '0px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--accent)', border: `2px solid var(--bg-base)`,
                pointerEvents: 'none',
              }} />
            )}

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute', top: '36px', right: '-12px',
                width: '320px', borderRadius: '12px', zIndex: 100,
                background: 'var(--bg-notif)',
                backdropFilter: 'blur(24px)',
                border: '1px solid var(--border-subtle)',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-divider)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent-border)',
                        borderRadius: '999px', padding: '1px 6px',
                      }}>{unreadCount}</span>
                    )}
                  </div>
                  <span
                    style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDismissedIds(allNotifications.map(n => n.id));
                      setShowNotifications(false);
                    }}
                  >DISMISS ALL</span>
                </div>

                {allNotifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No notifications
                  </div>
                ) : (
                  allNotifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-divider)',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const ticket = tickets.find(t => t.id === n.id);
                        if (ticket) { setSelectedTicket(ticket); setShowNotifications(false); }
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }}>{n.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.text}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>{n.time}</p>
                      </div>
                      {n.dot && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '6px' }} />}
                    </div>
                  ))
                )}

                <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid var(--border-divider)' }}>
                  <span
                    style={{ fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotifications(false);
                      setFilter('all');
                      setSelectedTicket(null);
                      setShowProfile(false);
                      setShowAdmin(false);
                      setShowAnalytics(false);
                    }}
                  >VIEW ALL TICKETS</span>
                </div>
              </div>
            )}
          </div>

          {/* Settings icon */}
          <span
            className="material-symbols-outlined"
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px', transition: 'color 0.2s' }}
            onClick={() => setShowProfile(true)}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >settings</span>

          {/* Divider */}
          <div style={{ width: '1px', height: '32px', background: 'var(--border-subtle)', flexShrink: 0 }} />

          {/* User avatar + name */}
          <div
            onClick={() => setShowProfile(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt="avatar"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--accent-border)', flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #005974)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'var(--accent-logo-icon)',
                border: '1px solid var(--accent-border)', flexShrink: 0,
              }}>
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {currentUser.username}
              </p>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, height: '100%', width: '256px', zIndex: 40,
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        paddingTop: '72px',
        transition: 'background 0.3s',
      }}>

        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>

          <button
            onClick={() => setSelectedTicket(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'var(--accent-bg)',
              boxShadow: 'inset 3px 0 0 var(--accent)',
              color: 'var(--accent)',
              border: 'none', cursor: 'pointer', fontSize: '16px',
            }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span style={{ fontWeight: 600 }}>Dashboard</span>
          </button>

          <button
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '16px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAdmin(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '16px', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span>Admin Panel</span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAnalytics(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '16px', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="material-symbols-outlined">analytics</span>
              <span>Analytics</span>
            </button>
          )}
        </nav>

        <footer style={{
          padding: '8px 8px 24px',
          borderTop: '1px solid var(--border-divider)',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>

          {/* Theme toggle — full label in sidebar */}
          <div style={{ padding: '4px 8px' }}>
            <ThemeToggle compact={false} />
          </div>

          <button
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: '16px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#f87171', fontSize: '16px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </footer>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        marginLeft: '256px',
        paddingTop: '104px',
        paddingLeft: '32px',
        paddingRight: '32px',
        paddingBottom: '40px',
        minHeight: '100vh',
      }}>

        {!selectedTicket && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                Ticket Overview
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Manage and monitor active IT support requests
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 18px', borderRadius: '999px',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: filter === f ? 'var(--accent-bg)' : 'var(--bg-input)',
                    border:     filter === f ? '1px solid var(--accent-border)' : '1px solid var(--border-subtle)',
                    color:      filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                    boxShadow:  filter === f ? '0 0 12px var(--accent-shadow)' : 'none',
                  }}
                >
                  {filterLabel[f]}
                  <span style={{
                    padding: '1px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                    background: filter === f ? 'var(--accent-bg)' : 'var(--bg-hover)',
                    color:      filter === f ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTicket && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => setSelectedTicket(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                {selectedTicket.title}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Ticket #{selectedTicket.id}
              </p>
            </div>
            <span style={{
              marginLeft: '8px',
              padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '6px',
              color:      selectedTicket.priority === 'high' ? '#f87171' : selectedTicket.priority === 'medium' ? '#fbbf24' : '#4ade80',
              background: selectedTicket.priority === 'high' ? 'rgba(248,113,113,0.1)' : selectedTicket.priority === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.1)',
              border: `1px solid ${selectedTicket.priority === 'high' ? 'rgba(248,113,113,0.3)' : selectedTicket.priority === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)'}`,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {selectedTicket.priority.toUpperCase()} PRIORITY
            </span>
          </div>
        )}

        {loading && !selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', color: 'var(--text-secondary)' }}>
            <div className="spinner" />
            <p style={{ fontSize: '16px' }}>Loading tickets...</p>
          </div>
        )}

        {error && !selectedTicket && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171',
            fontSize: '14px',
          }}>
            <span className="material-symbols-outlined">error</span>
            {error}
            <button onClick={fetchTickets} style={{ marginLeft: 'auto', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && !selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3 }}>inbox</span>
            <p style={{ fontSize: '16px' }}>
              {search || filter !== 'all' ? 'No tickets match your filters.' : 'No tickets yet.'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={openCreate}
                style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, background: 'var(--accent)', color: 'var(--accent-logo-icon)', border: 'none', cursor: 'pointer' }}
              >
                Create First Ticket
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && !selectedTicket && (
          <div className="grid gap-gutter" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
            {filtered.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={openEdit}
                onDelete={handleDelete}
                onSelect={setSelectedTicket}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}

        {selectedTicket && (
          <div className="grid gap-gutter" style={{ gridTemplateColumns: '7fr 5fr', alignItems: 'start' }}>

            <div style={{
              borderRadius: '12px', padding: '24px',
              background: 'var(--bg-surface)',
              backdropFilter: 'blur(20px)',
              borderTop:    '1px solid var(--border-subtle)',
              borderRight:  '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              borderLeft:   `4px solid ${selectedTicket.priority === 'high' ? '#f87171' : selectedTicket.priority === 'medium' ? '#fbbf24' : '#4ade80'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>SUBJECT</span>
                  <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{selectedTicket.title}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>STATUS</span>
                  <span style={{
                    padding: '4px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color:      selectedTicket.status === 'open' ? '#89CFF0' : selectedTicket.status === 'in_progress' ? '#c084fc' : '#6b7280',
                    background: selectedTicket.status === 'open' ? 'rgba(137,207,240,0.1)' : selectedTicket.status === 'in_progress' ? 'rgba(192,132,252,0.1)' : 'rgba(107,114,128,0.1)',
                    border: `1px solid ${selectedTicket.status === 'open' ? 'rgba(137,207,240,0.3)' : selectedTicket.status === 'in_progress' ? 'rgba(192,132,252,0.3)' : 'rgba(107,114,128,0.2)'}`,
                  }}>
                    {selectedTicket.status === 'in_progress' ? 'IN PROGRESS' : selectedTicket.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>{selectedTicket.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>CREATED BY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '20px' }}>account_circle</span>
                    <span style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{selectedTicket.created_by}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>DATE OPENED</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '20px' }}>calendar_today</span>
                    <span style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                      {new Date(selectedTicket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{ borderRadius: '12px', padding: '24px', background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined">forum</span>
                  Discussion Thread
                </h4>
                <CommentSection ticketId={selectedTicket.id} currentUser={currentUser} />
              </div>

              <div style={{ borderRadius: '12px', padding: '24px', background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>QUICK ACTIONS</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

                  {(currentUser.role === 'admin' || selectedTicket.created_by?.toLowerCase() === currentUser.username?.toLowerCase()) && (
                    <button
                      onClick={() => openEdit(selectedTicket)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)', background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>edit</span>
                      Edit
                    </button>
                  )}

                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)', background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>history</span>
                    History
                  </button>

                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: 'var(--text-primary)', background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>share</span>
                    Share
                  </button>

                  {(currentUser.role === 'admin' || selectedTicket.created_by?.toLowerCase() === currentUser.username?.toLowerCase()) && (
                    <button
                      onClick={() => handleDelete(selectedTicket.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: '#f87171', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      Delete
                    </button>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FLOATING ACTION BUTTON ── */}
      <button
        onClick={openCreate}
        title="New Ticket"
        style={{
          position: 'fixed', bottom: '40px', right: '32px', zIndex: 50,
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 24px var(--accent-shadow)`,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = `0 0 32px var(--accent)`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = `0 0 24px var(--accent-shadow)`; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '30px', color: 'var(--accent)' }}>add</span>
      </button>

      {/* ── TICKET MODAL ── */}
      <TicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={editingTicket ? handleEdit : handleCreate}
        editingTicket={editingTicket}
      />

    </div>
  );
}

export default App;