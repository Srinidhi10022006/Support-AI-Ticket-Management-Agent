/**
 * routes/tickets.js — Ticket REST endpoints
 */
const express = require('express');
const router  = express.Router();
const {
  createTicket, getTickets, getCustomerTickets,
  getTicket, acceptTicket, updateStatus,
  addReply, escalateTicket, customerResolve,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// POST   /api/tickets                     — customer creates a ticket
// GET    /api/tickets                     — list (agents/admins see all; customers see own)
router.route('/')
  .post(createTicket)
  .get(getTickets);

// GET  /api/tickets/customer/:customerId  — list tickets for a specific customer
router.get('/customer/:customerId', getCustomerTickets);

// GET  /api/tickets/:id                   — full ticket detail
router.get('/:id', getTicket);

// PATCH /api/tickets/:id/accept           — agent claims ticket (agents/admins only)
router.patch('/:id/accept', authorize('agent', 'admin'), acceptTicket);

// PATCH /api/tickets/:id/status           — update ticket status (agents/admins only)
router.patch('/:id/status', authorize('agent', 'admin'), updateStatus);

// POST  /api/tickets/:id/reply            — add reply or internal note (all authed users)
router.post('/:id/reply', addReply);

// PATCH /api/tickets/:id/escalate         — escalate / reassign (agents/admins only)
router.patch('/:id/escalate', authorize('agent', 'admin'), escalateTicket);

// PATCH /api/tickets/:id/customer-resolve — customer confirms their issue is resolved (customers only)
router.patch('/:id/customer-resolve', authorize('customer'), customerResolve);

module.exports = router;
