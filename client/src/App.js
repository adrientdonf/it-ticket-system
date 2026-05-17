import React, { useState, useEffect, useCallback } from 'react';
import TicketCard from './components/TicketCard';
import TicketModal from './components/TicketModal';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
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
  const [tickets,       setTickets]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [search,        setSearch]        = useState('');

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
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header__inner">

          {/* Left: branding */}
          <div className="header__brand">
            <span className="header__icon">🎫</span>
            <div>
              <span className="header__title">TicketDesk</span>
              <span className="header__sub">IT Support System</span>
            </div>
          </div>

          {/* Right: admin button (admins only), username, logout, new ticket */}
          <div className="header__right">
            {currentUser.role === 'admin' && (
              <button className="btn btn--ghost btn--sm" onClick={() => setShowAdmin(true)}>
                🛡️ Admin
              </button>
            )}
            <span
              className="header__user"
              onClick={() => setShowProfile(true)}
              style={{ cursor: 'pointer' }}
              title="View profile"
            >
              👤 {currentUser.username}
            </span>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Log out
            </button>
            <button className="btn btn--primary" onClick={openCreate}>
              + New Ticket
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main">

        {/* Filter pills + search bar */}
        <div className="stats-bar">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`stat-pill ${filter === f ? 'stat-pill--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              <span className="stat-pill__label">{filterLabel[f]}</span>
              <span className="stat-pill__count">{counts[f]}</span>
            </button>
          ))}
          <input
            className="search-input"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="state-view">
            <div className="spinner" />
            <p>Loading tickets...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="state-view state-view--error">
            <span className="state-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn btn--ghost" onClick={fetchTickets}>Retry</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="state-view">
            <span className="state-icon">📭</span>
            <p>
              {search || filter !== 'all'
                ? 'No tickets match your filters.'
                : 'No tickets yet. Create your first one!'}
            </p>
            {!search && filter === 'all' && (
              <button className="btn btn--primary" onClick={openCreate}>Create Ticket</button>
            )}
          </div>
        )}

        {/* Ticket grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="ticket-grid">
            {filtered.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={openEdit}
                onDelete={handleDelete}
                currentUser={currentUser}
              />
            ))}
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