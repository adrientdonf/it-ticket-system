const { validationResult } = require('express-validator');
const Ticket = require('../models/ticketModel');

const createTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const { title, description, priority = 'medium', created_by } = req.body;
    const newId = await Ticket.createTicket({ title, description, priority, created_by });
    const ticket = await Ticket.getTicketById(newId);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    console.error('createTicket error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.getAllTickets();
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    console.error('getAllTickets error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    console.error('getTicketById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const affected = await Ticket.updateTicket(req.params.id, req.body);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    const updated = await Ticket.getTicketById(req.params.id);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('updateTicket error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const affected = await Ticket.deleteTicket(req.params.id);
    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('deleteTicket error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createTicket, getAllTickets, getTicketById, updateTicket, deleteTicket };
