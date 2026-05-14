// ─────────────────────────────────────────────────────────────────────────────
// ticketRoutes.js
// Defines all the API endpoints for tickets.
// Routes receive the HTTP request, validate the data,
// then pass it to the correct controller function.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket
} = require('../controllers/ticketController');


// ── Validation rules for creating a ticket ────────────────────────────────────
// These rules run before the controller — if they fail, we return a 400 error.
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
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('created_by')
    .trim()
    .notEmpty().withMessage('created_by is required')
];


// ── Validation rules for updating a ticket ────────────────────────────────────
const updateValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('status').isIn(['open', 'in_progress', 'closed']).withMessage('Invalid status')
];


// ── API Routes ────────────────────────────────────────────────────────────────
router.post('/',      ticketValidation,  createTicket);   // Create a ticket
router.get('/',                          getAllTickets);   // Get all tickets
router.get('/:id',                       getTicketById);  // Get one ticket
router.put('/:id',    updateValidation,  updateTicket);   // Update a ticket
router.delete('/:id',                    deleteTicket);   // Delete a ticket


module.exports = router;