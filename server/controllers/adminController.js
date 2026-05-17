const db = require('../config/db');

// ── GET ALL USERS ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// Returns a list of all users in the system.
// Password is never included for security.
const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`
    );
    return res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── UPDATE USER ROLE ──────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/role
// Allows an admin to change a user's role to 'admin' or 'employee'.
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Only allow valid roles
    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin or employee.' });
    }

    // Prevent admin from changing their own role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    const [result] = await db.execute(
      `UPDATE users SET role = ? WHERE id = ?`,
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: `User role updated to ${role}.` });

  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE USER ───────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Permanently removes a user from the system.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const [result] = await db.execute(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: 'User deleted successfully.' });

  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };