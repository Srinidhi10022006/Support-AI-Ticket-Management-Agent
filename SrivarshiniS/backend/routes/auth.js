/**
 * routes/auth.js — Authentication routes
 */
const express  = require('express');
const router   = express.Router();
const { register, login, getMe, updateAvailability } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/auth/register
// Public for customers; admin-only for agent/admin role (checked in controller)
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PATCH /api/auth/me/availability  (agents only)
router.patch('/me/availability', protect, authorize('agent', 'admin'), updateAvailability);

module.exports = router;
