/**
 * routes/users.js — User management routes
 */
const express = require('express');
const router  = express.Router();
const {
  getAgents, getUser, updateMe, getMyStats, getAvailableAgents,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET  /api/users/agents           — list all agents (agents + admins)
router.get('/agents', authorize('agent', 'admin'), getAgents);

// GET  /api/users/agents/available — agents currently online (for escalation)
router.get('/agents/available', authorize('agent', 'admin'), getAvailableAgents);

// GET  /api/users/me/stats         — personal performance stats
router.get('/me/stats', getMyStats);

// PATCH /api/users/me              — update own profile
router.patch('/me', updateMe);

// GET  /api/users/:id              — get single user profile
router.get('/:id', getUser);

module.exports = router;
