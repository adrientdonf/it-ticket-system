const express = require('express');
const router = express.Router({ mergeParams: true });
// ↑ mergeParams: true is required so we can access :id from the parent route (ticketRoutes)

const { protect } = require('../middleware/authMiddleware');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');

// ── GET ALL COMMENTS FOR A TICKET ─────────────────────────────────────────────
// GET /api/tickets/:id/comments
router.get('/', protect, getComments);

// ── ADD A COMMENT TO A TICKET ─────────────────────────────────────────────────
// POST /api/tickets/:id/comments
router.post('/', protect, addComment);

// ── DELETE A COMMENT ──────────────────────────────────────────────────────────
// DELETE /api/tickets/:id/comments/:commentId
router.delete('/:commentId', protect, deleteComment);

module.exports = router;