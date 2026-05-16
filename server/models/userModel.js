const db = require('../config/db');

// Create a new user
const createUser = async ({ username, email, password, role = 'employee' }) => {
  const [result] = await db.execute(
    `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
    [username, email, password, role]
  );

  return result.insertId;
};

// Find user by email (for login)
const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE email = ?`,
    [email]
  );

  return rows[0];
};

// Find user by id (for /me route later)
const findUserById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, username, email, role, created_at FROM users WHERE id = ?`,
    [id]
  );

  return rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};