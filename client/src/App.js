import React, { useState, useEffect, useCallback } from 'react';
import TicketCard from './components/TicketCard';
import TicketModal from './components/TicketModal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import CommentSection from './components/CommentSection';
import { getTickets, createTicket, updateTicket, deleteTicket } from './services/api';
import './App.css';

const FILTERS = ['all', 'open', 'in_progress', 'closed'];

function App() {

  // ── Auth State ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
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
  const [showRegister,       setShowRegister]       = useState(false);
  const [showProfile,        setShowProfile]        = useState(false);
  const [showAdmin,          setShowAdmin]          = useState(false);
  const [showNotifications,  setShowNotifications]  = useState(false);

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
    setCurrentUser(null);
    setTickets([]);
  };

  // ── Ticket Handlers ─────────────────────────────────────────────────────────
 const handleCreate = async (form) => { 
  await createTicket(form); 
  await fetchTickets(); 
};

const handleEdit = async (form) => { 
  await updateTicket(editingTicket.id, form); 
  await fetchTickets(); 
};

const handleDelete = async (id) => {
  if (!window.confirm('Delete this ticket?')) return;
  await deleteTicket(id);
  await fetchTickets();
  if (selectedTicket?.id === id) setSelectedTicket(null);
};

  const openCreate = () => { setEditingTicket(null); setModalOpen(true); };
  const openEdit   = (ticket) => { setEditingTicket(ticket); setModalOpen(true); };

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

  const filterLabel = {
    all: 'All', open: 'Open', in_progress: 'In Progress', closed: 'Closed',
  };

  // ── Auth Guard ──────────────────────────────────────────────────────────────
  if (!currentUser) {
    if (showRegister) {
      return <RegisterPage onLogin={handleLogin} onGoToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onGoToRegister={() => setShowRegister(true)} />;
  }

  if (showProfile) {
    return <ProfilePage currentUser={currentUser} tickets={tickets} onBack={() => setShowProfile(false)} />;
  }

  if (showAdmin && currentUser.role === 'admin') {
    return <AdminPage currentUser={currentUser} onBack={() => setShowAdmin(false)} />;
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: '#000000', fontFamily: "'Hanken Grotesk', sans-serif" }}
      onClick={() => setShowNotifications(false)}
    >

      {/* ── FIXED TOP HEADER ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '72px',
        background: 'rgba(19,19,19,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 15px rgba(137,207,240,0.08)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
        gap: '24px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#89CFF0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#003546', fontSize: '22px' }}>terminal</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#bce8ff', letterSpacing: '-0.02em', margin: 0 }}>
            TicketDesk
          </h1>
        </div>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: '#bfc8cd', fontSize: '18px', pointerEvents: 'none',
          }}>search</span>
          <input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '9px 16px 9px 40px',
              color: '#e2e2e2',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(137,207,240,0.4)';
              e.target.style.boxShadow   = '0 0 12px rgba(137,207,240,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              e.target.style.boxShadow   = 'none';
            }}
          />
        </div>

        {/* Right: icons + user */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>

          {/* Notification bell */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <span
              className="material-symbols-outlined"
              style={{ color: '#bfc8cd', cursor: 'pointer', fontSize: '22px', display: 'block', transition: 'color 0.2s' }}
              onClick={() => setShowNotifications(prev => !prev)}
              onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
              onMouseLeave={e => e.currentTarget.style.color = '#bfc8cd'}
            >notifications</span>
            <span style={{
              position: 'absolute', top: '1px', right: '0px',
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#89CFF0', border: '2px solid #000',
              pointerEvents: 'none',
            }} />

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute', top: '36px', right: '-12px',
                width: '300px', borderRadius: '12px', zIndex: 100,
                background: 'rgba(19,19,19,0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e2e2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Notifications
                  </span>
                  <span
  style={{ fontSize: '10px', color: '#89CFF0', fontWeight: 700, cursor: 'pointer' }}
  onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
>
  DISMISS ALL
</span>
                </div>

                {/* Items */}
                {[
                  { icon: 'confirmation_number', text: 'New ticket assigned to you',  time: '2m ago',  dot: true  },
                  { icon: 'chat',                text: 'New comment on Ticket #42',    time: '15m ago', dot: true  },
                  { icon: 'check_circle',        text: 'Ticket #38 marked as closed', time: '1h ago',  dot: false },
                ].map(({ icon, text, time, dot }, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#89CFF0', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#e2e2e2', lineHeight: 1.4 }}>{text}</p>
                      <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bfc8cd' }}>{time}</p>
                    </div>
                    {dot && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#89CFF0', flexShrink: 0, marginTop: '6px' }} />}
                  </div>
                ))}

                {/* Footer */}
                <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#89CFF0', cursor: 'pointer', fontWeight: 700 }}>
                    VIEW ALL NOTIFICATIONS
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Settings icon — opens Profile page */}
          <span
            className="material-symbols-outlined"
            style={{ color: '#bfc8cd', cursor: 'pointer', fontSize: '22px', transition: 'color 0.2s' }}
            onClick={() => setShowProfile(true)}
            onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
            onMouseLeave={e => e.currentTarget.style.color = '#bfc8cd'}
          >settings</span>

          {/* Divider */}
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          {/* User avatar + name */}
          <div
            onClick={() => setShowProfile(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #89CFF0, #005974)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#003546',
              border: '1px solid rgba(137,207,240,0.3)', flexShrink: 0,
            }}>
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#e2e2e2', lineHeight: 1.2 }}>
                {currentUser.username}
              </p>
              <p style={{ margin: 0, fontSize: '10px', color: '#89CFF0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, height: '100%', width: '256px', zIndex: 40,
        background: 'rgba(31,31,31,0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        paddingTop: '72px',
      }}>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>

          {/* Dashboard */}
          <button
            onClick={() => setSelectedTicket(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'rgba(137,207,240,0.1)',
              boxShadow: 'inset 3px 0 0 #89CFF0',
              color: '#89CFF0',
              border: 'none', cursor: 'pointer', fontSize: '16px',
            }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span style={{ fontWeight: 600 }}>Dashboard</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#bfc8cd', fontSize: '16px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </button>

          {/* Admin Panel — admins only */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAdmin(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#bfc8cd', fontSize: '16px', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Footer: Settings + Logout */}
        <footer style={{
          padding: '8px 8px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#bfc8cd', fontSize: '16px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
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
              color: '#ffb4ab', fontSize: '16px', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,180,171,0.06)'}
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

        {/* ── PAGE HEADER: title + filter pills ── */}
        {!selectedTicket && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#e2e2e2', letterSpacing: '-0.02em' }}>
                Ticket Overview
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#bfc8cd' }}>
                Manage and monitor active IT support requests
              </p>
            </div>

            {/* Filter pills */}
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
                    background: filter === f ? 'rgba(137,207,240,0.15)' : 'rgba(255,255,255,0.04)',
                    border:     filter === f ? '1px solid rgba(137,207,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color:      filter === f ? '#89CFF0' : '#bfc8cd',
                    boxShadow:  filter === f ? '0 0 12px rgba(137,207,240,0.15)' : 'none',
                  }}
                >
                  {filterLabel[f]}
                  <span style={{
                    padding: '1px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                    background: filter === f ? 'rgba(137,207,240,0.2)' : 'rgba(255,255,255,0.08)',
                    color:      filter === f ? '#89CFF0' : '#899297',
                  }}>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Back button row ── */}
        {selectedTicket && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => setSelectedTicket(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#bfc8cd', display: 'flex', alignItems: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
              onMouseLeave={e => e.currentTarget.style.color = '#bfc8cd'}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#e2e2e2', letterSpacing: '-0.02em' }}>
                {selectedTicket.title}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#bfc8cd' }}>
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

        {/* ── LOADING ── */}
        {loading && !selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', color: '#bfc8cd' }}>
            <div className="spinner" />
            <p style={{ fontSize: '16px' }}>Loading tickets...</p>
          </div>
        )}

        {/* ── ERROR ── */}
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

        {/* ── EMPTY STATE ── */}
        {!loading && !error && filtered.length === 0 && !selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', color: '#bfc8cd' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3 }}>inbox</span>
            <p style={{ fontSize: '16px' }}>
              {search || filter !== 'all' ? 'No tickets match your filters.' : 'No tickets yet.'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={openCreate}
                style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, background: '#89CFF0', color: '#003546', border: 'none', cursor: 'pointer' }}
              >
                Create First Ticket
              </button>
            )}
          </div>
        )}

        {/* ── TICKET GRID ── */}
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

        {/* ── EXPANDED TICKET VIEW ── */}
        {selectedTicket && (
          <div className="grid gap-gutter" style={{ gridTemplateColumns: '7fr 5fr', alignItems: 'start' }}>

            {/* LEFT: Ticket Details */}
            <div style={{
              borderRadius: '12px', padding: '24px',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              borderTop:    '1px solid rgba(255,255,255,0.08)',
              borderRight:  '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              borderLeft:   `4px solid ${selectedTicket.priority === 'high' ? '#f87171' : selectedTicket.priority === 'medium' ? '#fbbf24' : '#4ade80'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#bfc8cd', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>SUBJECT</span>
                  <h3 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#89CFF0', letterSpacing: '-0.02em' }}>{selectedTicket.title}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#bfc8cd', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>STATUS</span>
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

              <p style={{ fontSize: '16px', color: '#bfc8cd', lineHeight: 1.6, marginBottom: '24px' }}>{selectedTicket.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#bfc8cd', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>CREATED BY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>account_circle</span>
                    <span style={{ fontSize: '16px', color: '#e2e2e2' }}>{selectedTicket.created_by}</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#bfc8cd', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>DATE OPENED</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>calendar_today</span>
                    <span style={{ fontSize: '16px', color: '#e2e2e2' }}>
                      {new Date(selectedTicket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Discussion + Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Discussion thread */}
              <div style={{ borderRadius: '12px', padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#89CFF0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined">forum</span>
                  Discussion Thread
                </h4>
                <CommentSection ticketId={selectedTicket.id} currentUser={currentUser} />
              </div>

              {/* Quick actions */}
              <div style={{ borderRadius: '12px', padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: '#bfc8cd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>QUICK ACTIONS</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

                  {(currentUser.role === 'admin' || selectedTicket.created_by?.toLowerCase() === currentUser.username?.toLowerCase()) && (
                    <button
                      onClick={() => openEdit(selectedTicket)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: '#e2e2e2', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#89CFF0' }}>edit</span>
                      Edit
                    </button>
                  )}

                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: '#e2e2e2', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#89CFF0' }}>history</span>
                    History
                  </button>

                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: '#e2e2e2', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#89CFF0' }}>share</span>
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
          background: 'rgba(137,207,240,0.18)',
          border: '1px solid rgba(137,207,240,0.3)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(137,207,240,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(137,207,240,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 0 24px rgba(137,207,240,0.45)'; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '30px', color: '#89CFF0' }}>add</span>
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