const db = require('../config/db');

// ── Create User ───────────────────────────────────────────────────────────────
// Inserts a new user into the database and returns the new user's ID.
const createUser = async ({ username, email, password, role = 'employee' }) => {
  const [result] = await db.execute(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
    [username, email, password, role]
  );
  return result.insertId;
};

// ── Find User By Email ────────────────────────────────────────────────────────
// Used during login to look up a user and compare their password.
const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  );
  return rows[0];
};

// ── Find User By ID ───────────────────────────────────────────────────────────
// Used for the /me route and profile page.
// Does NOT return the password for security.
const findUserById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, username, email, password, role, created_at FROM users WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// ── Update Password ───────────────────────────────────────────────────────────
// Updates the hashed password for a user by their ID.
// We only store hashed passwords — never plain text.
const updatePassword = async (id, hashedPassword) => {
  await db.execute(
    `UPDATE users SET password = ? WHERE id = ?`,
    [hashedPassword, id]
  );
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updatePassword,
};