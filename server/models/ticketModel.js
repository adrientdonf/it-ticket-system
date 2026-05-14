const db = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// ticketModel.js
// Handles all direct database queries for the tickets table.
// This is the only place in the app that talks to the database directly.
// Controllers call these functions — they never write SQL themselves.
// ─────────────────────────────────────────────────────────────────────────────


// ── CREATE ───────────────────────────────────────────────────────────────────
// Inserts a new ticket into the database.
// Returns the auto-generated ID of the new ticket.
const createTicket = async ({ title, description, priority, created_by }) => {
  const [result] = await db.execute(
    `INSERT INTO tickets (title, description, priority, created_by)
     VALUES (?, ?, ?, ?)`,
    [title, description, priority, created_by]
  );
  return result.insertId;
};


// ── READ ALL ─────────────────────────────────────────────────────────────────
// Fetches every ticket from the database.
// Returns them newest first using ORDER BY created_at DESC.
const getAllTickets = async () => {
  const [rows] = await db.execute(
    `SELECT * FROM tickets ORDER BY created_at DESC`
  );
  return rows;
};


// ── READ ONE ─────────────────────────────────────────────────────────────────
// Fetches a single ticket by its ID.
// Returns undefined if no ticket is found with that ID.
const getTicketById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM tickets WHERE id = ?`,
    [id]
  );
  return rows[0];
};


// ── UPDATE ───────────────────────────────────────────────────────────────────
// Updates an existing ticket's fields by ID.
// Returns the number of rows affected (0 means ticket wasn't found).
const updateTicket = async (id, { title, description, priority, status }) => {
  const [result] = await db.execute(
    `UPDATE tickets
     SET title = ?, description = ?, priority = ?, status = ?
     WHERE id = ?`,
    [title, description, priority, status, id]
  );
  return result.affectedRows;
};


// ── DELETE ───────────────────────────────────────────────────────────────────
// Deletes a ticket from the database by ID.
// Returns the number of rows affected (0 means ticket wasn't found).
const deleteTicket = async (id) => {
  const [result] = await db.execute(
    `DELETE FROM tickets WHERE id = ?`,
    [id]
  );
  return result.affectedRows;
};


// Export all functions so controllers can use them
module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket
};