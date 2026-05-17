const express = require('express');
const router = express.Router();

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { getAllUsers, updateUserRole, deleteUser } = require('../controllers/adminController');

// All admin routes require:
// 1. protect   → valid JWT token (logged in)
// 2. adminOnly → user must have role = 'admin'

// ── GET ALL USERS ─────────────────────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', protect, adminOnly, getAllUsers);

// ── UPDATE USER ROLE ──────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/role
router.put('/users/:id/role', protect, adminOnly, updateUserRole);

// ── DELETE USER ───────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;