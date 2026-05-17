require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Database ───────────────────────────────────────────────────────────
require('./config/db');

// ── Routes ───────────────────────────────────────────────────────────────

// Authentication routes
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me
app.use('/api/auth', require('./routes/authRoutes'));

// Ticket CRUD routes
// GET, POST, PUT, DELETE /api/tickets
app.use('/api/tickets', require('./routes/ticketRoutes'));
// Admin routes (admin only)
// GET, PUT, DELETE /api/admin/users
app.use('/api/admin', require('./routes/adminRoutes'));
// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});