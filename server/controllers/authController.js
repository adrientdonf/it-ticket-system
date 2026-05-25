const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const { createUser, findUserByEmail, findUserById, updatePassword, updateAvatar, findUserByUsername, updateUsername } = require('../models/userModel');


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

    const user = { id: userId, username, email, role: role || 'employee', avatar_url: null };

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

    const safeUser = { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url };

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
const uploadAvatar = async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) return res.status(400).json({ success: false, message: 'No image data provided.' });

    // Upload base64 image to Cloudinary
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'ticketdesk/avatars',
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    });

    // Save URL to DB
    await updateAvatar(req.user.id, result.secure_url);

    res.json({ success: true, avatarUrl: result.secure_url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
  }
};
// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Submits a password reset request for an employee.
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email.' });
    }

    // Check if there's already a pending request for this user
    const db = require('../config/db');
    const [existing] = await db.execute(
      `SELECT * FROM password_reset_requests WHERE user_id = ? AND status = 'pending'`,
      [user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A reset request is already pending for this account.' });
    }

    await db.execute(
      `INSERT INTO password_reset_requests (user_id, username, email) VALUES (?, ?, ?)`,
      [user.id, user.username, email]
    );

    return res.json({ success: true, message: 'Reset request submitted. Please contact your IT admin.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
// ── CHANGE USERNAME ───────────────────────────────────────────────────────────
// PUT /api/auth/change-username
// Allows a logged-in user to change their username.
// Requires current password confirmation for security.
const changeUsername = async (req, res) => {
  try {
    const { newUsername, currentPassword } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!newUsername || !currentPassword) {
      return res.status(400).json({ success: false, message: 'New username and current password are required.' });
    }

    const trimmed = newUsername.trim();

    if (trimmed.length < 3 || trimmed.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 30 characters.' });
    }

    if (/\s/.test(trimmed)) {
      return res.status(400).json({ success: false, message: 'Username cannot contain spaces.' });
    }

    // ── Fetch user from DB (need hashed password) ─────────────────────────────
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // ── Verify current password before allowing change ────────────────────────
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Username not changed.' });
    }

    // ── Block same-as-current username ────────────────────────────────────────
    if (trimmed.toLowerCase() === user.username.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'New username must be different from your current one.' });
    }

    // ── Check uniqueness ──────────────────────────────────────────────────────
    const existing = await findUserByUsername(trimmed);
    if (existing) {
      return res.status(409).json({ success: false, message: 'That username is already taken.' });
    }

    // ── Save + return a fresh token with updated username ─────────────────────
    await updateUsername(req.user.id, trimmed);

    const updatedUser = { id: user.id, username: trimmed, email: user.email, role: user.role, avatar_url: user.avatar_url };
    const newToken = generateToken(updatedUser);

    return res.json({ success: true, message: 'Username updated successfully.', token: newToken, user: updatedUser });

  } catch (err) {
    console.error('Change username error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, changePassword, uploadAvatar, forgotPassword, changeUsername };