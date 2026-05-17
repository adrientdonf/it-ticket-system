// ── adminMiddleware.js ────────────────────────────────────────────────────────
// Runs AFTER the protect middleware (which verifies the JWT token).
// Checks if the logged-in user has the 'admin' role.
// If not, returns 403 Forbidden — they can't access admin routes.
// ─────────────────────────────────────────────────────────────────────────────

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.',
    });
  }
  next();
};

module.exports = { adminOnly };