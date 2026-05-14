import React, { useState, useEffect, useCallback } from 'react';
import TicketCard from './components/TicketCard';
import TicketModal from './components/TicketModal';
import { getTickets, createTicket, updateTicket, deleteTicket } from './services/api';
import './App.css';

const FILTERS = ['all', 'open', 'in_progress', 'closed'];

function App() {
  const [tickets, setTickets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');

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

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreate = async (form) => {
    await createTicket(form);
    fetchTickets();
  };

  const handleEdit = async (form) => {
    await updateTicket(editingTicket.id, form);
    fetchTickets();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    await deleteTicket(id);
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const openCreate = () => { setEditingTicket(null); setModalOpen(true); };
  const openEdit   = (ticket) => { setEditingTicket(ticket); setModalOpen(true); };

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

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__icon">🎫</span>
            <div>
              <span className="header__title">TicketDesk</span>
              <span className="header__sub">IT Support System</span>
            </div>
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            + New Ticket
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        {/* Stats bar */}
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

        {/* Content */}
        {loading && (
          <div className="state-view">
            <div className="spinner" />
            <p>Loading tickets...</p>
          </div>
        )}

        {error && (
          <div className="state-view state-view--error">
            <span className="state-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn btn--ghost" onClick={fetchTickets}>Retry</button>
          </div>
        )}

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

        {!loading && !error && filtered.length > 0 && (
          <div className="ticket-grid">
            {filtered.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ── */}
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