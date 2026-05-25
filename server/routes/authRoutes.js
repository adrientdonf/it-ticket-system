const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, changePassword, uploadAvatar, forgotPassword, changeUsername } = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const rateLimit = require('express-rate-limit');

const usernameChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
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
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
router.get('/me', protect, getMe);

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
router.put('/change-password', protect, changePassword);

// ── AVATAR ────────────────────────────────────────────────────────────────────
router.put('/avatar', protect, uploadAvatar);

// ── CHANGE USERNAME ───────────────────────────────────────────────────────────
router.put('/change-username', protect, usernameChangeLimiter, changeUsername);

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Submits a password reset request (no login required)
router.post('/forgot-password', forgotPassword);

module.exports = router;