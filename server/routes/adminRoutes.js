const express = require('express');
const router = express.Router();

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { getAllUsers, updateUserRole, deleteUser, getResetRequests, resolveResetRequest } = require('../controllers/adminController');

// All admin routes require:
// 1. protect   → valid JWT token (logged in)
// 2. adminOnly → user must have role = 'admin'

// ── GET ALL USERS ─────────────────────────────────────────────────────────────
router.get('/users', protect, adminOnly, getAllUsers);

// ── UPDATE USER ROLE ──────────────────────────────────────────────────────────
router.put('/users/:id/role', protect, adminOnly, updateUserRole);

// ── DELETE USER ───────────────────────────────────────────────────────────────
router.delete('/users/:id', protect, adminOnly, deleteUser);

// ── RESET REQUESTS ────────────────────────────────────────────────────────────
router.get('/reset-requests', protect, adminOnly, getResetRequests);
router.put('/reset-requests/:id/resolve', protect, adminOnly, resolveResetRequest);

module.exports = router;