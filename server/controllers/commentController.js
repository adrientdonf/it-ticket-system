const db = require('../config/db');

// ── GET COMMENTS FOR A TICKET ─────────────────────────────────────────────────
// GET /api/tickets/:id/comments
// Returns all comments for a specific ticket, newest first.
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [comments] = await db.execute(
      `SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC`,
      [id]
    );

    return res.json({ success: true, count: comments.length, data: comments });

  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── ADD COMMENT TO A TICKET ───────────────────────────────────────────────────
// POST /api/tickets/:id/comments
// Adds a new comment to a ticket. Uses the logged-in user's info from the JWT.
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    // Check ticket exists
    const [tickets] = await db.execute(`SELECT id FROM tickets WHERE id = ?`, [id]);
    if (tickets.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Insert comment using logged-in user's info from JWT
    const [result] = await db.execute(
      `INSERT INTO comments (ticket_id, user_id, username, content) VALUES (?, ?, ?, ?)`,
      [id, req.user.id, req.user.username, content.trim()]
    );

    // Return the newly created comment
    const [newComment] = await db.execute(
      `SELECT * FROM comments WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: newComment[0] });

  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE COMMENT ────────────────────────────────────────────────────────────
// DELETE /api/tickets/:id/comments/:commentId
// Only the comment author or an admin can delete a comment.
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find the comment first
    const [comments] = await db.execute(
      `SELECT * FROM comments WHERE id = ?`,
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const comment = comments[0];

    // Only allow deletion if user is the author or an admin
    const isAuthor = comment.user_id === req.user.id;
    const isAdmin  = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
    }

    await db.execute(`DELETE FROM comments WHERE id = ?`, [commentId]);

    return res.json({ success: true, message: 'Comment deleted.' });

  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getComments, addComment, deleteComment };