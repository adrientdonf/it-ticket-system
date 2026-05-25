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
const updateAvatar = async (id, avatarUrl) => {
  const [result] = await db.execute(
    'UPDATE users SET avatar_url = ? WHERE id = ?',
    [avatarUrl, id]
  );
  return result;
};
// ── Find User By Username ─────────────────────────────────────────────────────
// Used to check if a username is already taken before allowing a change.
const findUserByUsername = async (username) => {
  const [rows] = await db.execute(
    `SELECT id, username FROM users WHERE username = ?`,
    [username]
  );
  return rows[0];
};

// ── Update Username ───────────────────────────────────────────────────────────
// Updates the username for a user by their ID.
const updateUsername = async (id, username) => {
  await db.execute(
    `UPDATE users SET username = ? WHERE id = ?`,
    [username, id]
  );
};
module.exports = { createUser, findUserByEmail, findUserById, updatePassword, updateAvatar, findUserByUsername, updateUsername };