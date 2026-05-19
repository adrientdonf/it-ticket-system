import React, { useState, useEffect, useCallback } from 'react';
import TicketCard from './components/TicketCard';
import TicketModal from './components/TicketModal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { getTickets, createTicket, updateTicket, deleteTicket } from './services/api';
import './App.css';
import CommentSection from './components/CommentSection';
const FILTERS = ['all', 'open', 'in_progress', 'closed'];

function App() {

  // ── Auth State ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // ── Ticket State ────────────────────────────────────────────────────────────
  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [search,        setSearch]        = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ── Navigation State ────────────────────────────────────────────────────────
  // Controls which page is shown
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [showAdmin,    setShowAdmin]    = useState(false);

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
  const handleCreate = async (form) => { await createTicket(form); fetchTickets(); };
  const handleEdit   = async (form) => { await updateTicket(editingTicket.id, form); fetchTickets(); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    await deleteTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
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

  // ── Profile Page Guard ──────────────────────────────────────────────────────
  if (showProfile) {
    return <ProfilePage currentUser={currentUser} tickets={tickets} onBack={() => setShowProfile(false)} />;
  }

  // ── Admin Page Guard ────────────────────────────────────────────────────────
  // Only admins can see this page — non-admins can't reach it from the UI anyway
  if (showAdmin && currentUser.role === 'admin') {
    return <AdminPage currentUser={currentUser} onBack={() => setShowAdmin(false)} />;
  }

 // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen" style={{ background: '#000000', fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside
        className="fixed left-0 top-0 h-full flex flex-col z-40 w-64"
        style={{
          background: 'rgba(31,31,31,0.6)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-md px-lg pt-lg pb-xl">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: '#89CFF0' }}
          >
            <span className="material-symbols-outlined text-on-primary-container">terminal</span>
          </div>
          <div>
            <h1 className="text-title-md font-bold text-primary leading-none">TicketDesk</h1>
            <p className="text-body-sm text-on-surface-variant">IT Command Center</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 px-sm">

          {/* Dashboard — always active on this page */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary"
            style={{ background: 'rgba(137,207,240,0.1)', borderLeft: '3px solid #89CFF0' }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-body-lg font-semibold">Dashboard</span>
          </div>

          {/* Profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant w-full text-left transition-all"
            style={{ border: 'none', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-body-lg">Profile</span>
          </button>

          {/* Admin Panel — only for admins */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant w-full text-left transition-all"
              style={{ border: 'none', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className="text-body-lg">Admin Panel</span>
            </button>
          )}
        </nav>

        {/* New Ticket button */}
        <div className="px-lg pb-lg">
          <button
            onClick={openCreate}
            className="w-full flex items-center justify-center gap-sm py-md rounded-xl text-title-md font-semibold transition-all"
            style={{ background: '#89CFF0', color: '#003546' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span className="material-symbols-outlined">add</span>
            New Ticket
          </button>
        </div>

        {/* Footer: Logout */}
        <footer
          className="flex flex-col gap-1 px-sm pb-lg"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant w-full text-left transition-all"
            style={{ border: 'none', background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-body-lg">Logout</span>
          </button>
        </footer>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col" style={{ marginLeft: '256px', padding: '32px' }}>

        {/* Top header */}
        <header className="flex items-center justify-between pb-xl">
          <div>
            <h2 className="text-headline-lg text-on-background">Dashboard</h2>
            <p className="text-body-sm text-on-surface-variant">
              {counts.all} ticket{counts.all !== 1 ? 's' : ''} total
            </p>
          </div>

          {/* User chip */}
          <div
            className="flex items-center gap-sm px-md py-sm rounded-full cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => setShowProfile(true)}
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>account_circle</span>
            <span className="text-body-sm text-on-surface">{currentUser.username}</span>
            <span
              className="text-label-caps px-2 py-0.5 rounded-full font-bold"
              style={{
                background: currentUser.role === 'admin' ? 'rgba(137,207,240,0.15)' : 'rgba(255,255,255,0.06)',
                color: currentUser.role === 'admin' ? '#89CFF0' : '#bfc8cd',
              }}
            >
              {currentUser.role}
            </span>
          </div>
        </header>

        {/* Filter pills + search */}
        <div className="flex items-center gap-sm flex-wrap mb-xl">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-semibold transition-all"
              style={{
                background: filter === f ? 'rgba(137,207,240,0.15)' : 'rgba(255,255,255,0.04)',
                border: filter === f ? '1px solid rgba(137,207,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: filter === f ? '#89CFF0' : '#bfc8cd',
              }}
            >
              {filterLabel[f]}
              <span
                className="text-label-caps px-2 py-0.5 rounded-full"
                style={{
                  background: filter === f ? 'rgba(137,207,240,0.2)' : 'rgba(255,255,255,0.08)',
                  color: filter === f ? '#89CFF0' : '#899297',
                }}
              >
                {counts[f]}
              </span>
            </button>
          ))}

          {/* Search */}
          <div className="relative ml-auto">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              style={{ fontSize: '18px' }}
            >
              search
            </span>
            <input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full text-body-sm text-on-surface placeholder-on-surface-variant outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                width: '220px',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(137,207,240,0.4)';
                e.target.style.boxShadow = '0 0 12px rgba(137,207,240,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-on-surface-variant">
            <div className="spinner" />
            <p className="text-body-lg">Loading tickets...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-3 px-lg py-md rounded-xl text-body-sm mb-lg"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
          >
            <span className="material-symbols-outlined">error</span>
            {error}
            <button
              onClick={fetchTickets}
              className="ml-auto text-body-sm underline"
              style={{ color: '#f87171' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3 }}>inbox</span>
            <p className="text-body-lg">
              {search || filter !== 'all' ? 'No tickets match your filters.' : 'No tickets yet.'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={openCreate}
                className="px-lg py-md rounded-xl text-title-md font-semibold"
                style={{ background: '#89CFF0', color: '#003546' }}
              >
                Create First Ticket
              </button>
            )}
          </div>
        )}

       {/* Ticket grid */}
        {!loading && !error && filtered.length > 0 && !selectedTicket && (
          <div
            className="grid gap-gutter"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}
          >
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
          <div>
            {/* Back button + ticket title in header area */}
            <div className="flex items-center gap-md mb-xl">
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center gap-1 text-on-surface-variant transition-all"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
                onMouseLeave={e => e.currentTarget.style.color = '#bfc8cd'}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span className="text-body-sm">Back</span>
              </button>
              <span className="text-on-surface-variant" style={{ opacity: 0.3 }}>|</span>
              <span className="text-body-sm text-on-surface-variant">Ticket #{selectedTicket.id}</span>
              {/* Priority badge */}
              <span
                className="text-label-caps px-3 py-1 rounded-full font-bold"
                style={{
                  color: selectedTicket.priority === 'high' ? '#f87171' : selectedTicket.priority === 'medium' ? '#fbbf24' : '#4ade80',
                  background: selectedTicket.priority === 'high' ? 'rgba(248,113,113,0.1)' : selectedTicket.priority === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.1)',
                  border: `1px solid ${selectedTicket.priority === 'high' ? 'rgba(248,113,113,0.3)' : selectedTicket.priority === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)'}`,
                }}
              >
                {selectedTicket.priority.toUpperCase()} PRIORITY
              </span>
            </div>

            {/* Two-column layout */}
            <div className="grid gap-gutter" style={{ gridTemplateColumns: '7fr 5fr', alignItems: 'start' }}>

              {/* ── LEFT: Ticket Details ── */}
              <div className="flex flex-col gap-gutter">
                <div
                  className="rounded-xl p-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: `4px solid ${selectedTicket.priority === 'high' ? '#f87171' : selectedTicket.priority === 'medium' ? '#fbbf24' : '#4ade80'}`,
                  }}
                >
                  {/* Subject + Status */}
                  <div className="flex justify-between items-start mb-lg">
                    <div>
                      <span className="text-label-caps text-on-surface-variant block mb-xs">SUBJECT</span>
                      <h3 className="text-headline-lg text-primary">{selectedTicket.title}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-label-caps text-on-surface-variant block mb-xs">STATUS</span>
                      <span
                        className="text-label-caps px-md py-xs rounded-full font-bold"
                        style={{
                          color: selectedTicket.status === 'open' ? '#89CFF0' : selectedTicket.status === 'in_progress' ? '#c084fc' : '#6b7280',
                          background: selectedTicket.status === 'open' ? 'rgba(137,207,240,0.1)' : selectedTicket.status === 'in_progress' ? 'rgba(192,132,252,0.1)' : 'rgba(107,114,128,0.1)',
                          border: `1px solid ${selectedTicket.status === 'open' ? 'rgba(137,207,240,0.3)' : selectedTicket.status === 'in_progress' ? 'rgba(192,132,252,0.3)' : 'rgba(107,114,128,0.2)'}`,
                        }}
                      >
                        {selectedTicket.status === 'in_progress' ? 'IN PROGRESS' : selectedTicket.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-body-lg text-on-surface-variant mb-lg">{selectedTicket.description}</p>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-lg pt-lg" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <span className="text-label-caps text-on-surface-variant block mb-xs">CREATED BY</span>
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>account_circle</span>
                        <span className="text-body-lg text-on-surface">{selectedTicket.created_by}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-label-caps text-on-surface-variant block mb-xs">DATE</span>
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>calendar_today</span>
                        <span className="text-body-lg text-on-surface">
                          {new Date(selectedTicket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Discussion + Quick Actions ── */}
              <div className="flex flex-col gap-gutter">

                {/* Discussion thread */}
                <div
                  className="rounded-xl p-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-lg">
                    <h4 className="text-title-md text-primary flex items-center gap-sm">
                      <span className="material-symbols-outlined">forum</span>
                      Discussion Thread
                    </h4>
                  </div>
                  <CommentSection ticketId={selectedTicket.id} currentUser={currentUser} />
                </div>

                {/* Quick actions */}
                <div
                  className="rounded-xl p-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <h4 className="text-label-caps text-on-surface-variant mb-md">QUICK ACTIONS</h4>
                  <div className="grid grid-cols-2 gap-sm">

                    {(currentUser.role === 'admin' || selectedTicket.created_by?.toLowerCase() === currentUser.username?.toLowerCase()) && (
                      <button
                        onClick={() => openEdit(selectedTicket)}
                        className="flex items-center gap-sm p-sm rounded-lg text-on-surface text-body-sm transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>edit</span>
                        Edit
                      </button>
                    )}

                    <button
                      className="flex items-center gap-sm p-sm rounded-lg text-on-surface text-body-sm transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>history</span>
                      History
                    </button>

                    <button
                      className="flex items-center gap-sm p-sm rounded-lg text-on-surface text-body-sm transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>share</span>
                      Share
                    </button>

                    {(currentUser.role === 'admin' || selectedTicket.created_by?.toLowerCase() === currentUser.username?.toLowerCase()) && (
                      <button
                        onClick={() => { handleDelete(selectedTicket.id); setSelectedTicket(null); }}
                        className="flex items-center gap-sm p-sm rounded-lg text-body-sm transition-all"
                        style={{ border: '1px solid rgba(248,113,113,0.2)', background: 'transparent', color: '#f87171' }}
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
          </div>
        )}
      </main>

      {/* ── Create / Edit Modal ── */}
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