const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { summarizeTicket, detectIncidents } = require('../controllers/aiController');

// ── AI ROUTES ─────────────────────────────────────────────────────────────────
router.post('/summarize', protect, summarizeTicket);
router.post('/detect-incidents', protect, detectIncidents);

module.exports = router;