const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// REGISTER
router.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  register
);

// LOGIN
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

// GET CURRENT USER (protected route)
router.get('/me', protect, getMe);

module.exports = router;