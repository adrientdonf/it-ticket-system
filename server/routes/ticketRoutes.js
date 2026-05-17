// ─────────────────────────────────────────────────────────────────────────────
// ticketRoutes.js
// Defines all API endpoints for tickets.
// Routes are protected using JWT authentication middleware.
// Only logged-in users can access ticket operations.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// JWT AUTH MIDDLEWARE
const { protect } = require('../middleware/authMiddleware');

// Ticket controller functions
const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket
} = require('../controllers/ticketController');


// ── Validation rules for creating a ticket ────────────────────────────────────
// Runs before controller. If invalid → returns 400 error.
const ticketValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be under 255 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high')
];


// ── Validation rules for updating a ticket ────────────────────────────────────
const updateValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),

  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority'),

  body('status')
    .isIn(['open', 'in_progress', 'closed'])
    .withMessage('Invalid status')
];


// ── PROTECTED API ROUTES (JWT REQUIRED) ──────────────────────────────────────
// All routes require Authorization: Bearer <token>

// CREATE TICKET
router.post('/', protect, ticketValidation, createTicket);

// GET ALL TICKETS
router.get('/', protect, getAllTickets);

// GET SINGLE TICKET
router.get('/:id', protect, getTicketById);

// UPDATE TICKET
router.put('/:id', protect, updateValidation, updateTicket);

// DELETE TICKET
router.delete('/:id', protect, deleteTicket);

// Nest comment routes under tickets
// e.g. GET /api/tickets/:id/comments
router.use('/:id/comments', require('./commentRoutes'));

module.exports = router;