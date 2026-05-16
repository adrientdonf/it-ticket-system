const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── REGISTER ──────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account. Validates input before hitting the controller.
router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Returns a JWT token on successful login.
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
// GET /api/auth/me
// Returns the logged-in user's info. Requires a valid JWT token.
router.get('/me', protect, getMe);

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// Allows a logged-in user to update their password.
// Requires a valid JWT token (protect middleware).
router.put('/change-password', protect, changePassword);

module.exports = router;