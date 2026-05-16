const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const { createUser, findUserByEmail, findUserById, updatePassword } = require('../models/userModel');
// ── Generate JWT ──────────────────────────────────────────────────────────────
// Creates a signed JWT token containing the user's id, username, and role.
// Token expires in 7 days.
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── REGISTER ──────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account with a hashed password.
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { username, email, password, role } = req.body;

    // Check if email is already taken
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash the password before saving — never store plain text passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = await createUser({ username, email, password: hashedPassword, role });

    const user = { id: userId, username, email, role: role || 'employee' };

    return res.status(201).json({ success: true, token: generateToken(user), user });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Verifies credentials and returns a JWT token on success.
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Look up user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare submitted password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const safeUser = { id: user.id, username: user.username, email: user.email, role: user.role };

    return res.json({ success: true, token: generateToken(safeUser), user: safeUser });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns the currently logged-in user's info from the JWT token.
const getMe = (req, res) => {
  return res.json({ success: true, user: req.user });
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// Allows a logged-in user to change their password.
// Requires current password for verification before updating.
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Fetch full user record (including hashed password) from DB
   const user = await findUserById(req.user.id);
  
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password is correct before allowing change
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    const hashedNew = await bcrypt.hash(newPassword, salt);
    await updatePassword(req.user.id, hashedNew);

    return res.json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, changePassword };