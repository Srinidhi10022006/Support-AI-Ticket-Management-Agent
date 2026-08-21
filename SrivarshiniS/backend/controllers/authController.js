/**
 * controllers/authController.js — Register, Login, Me
 */
const jwt             = require('jsonwebtoken');
const User            = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/* ── Generate signed JWT ── */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/* ── Send token in response ── */
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:                 user._id,
      name:               user.name,
      email:              user.email,
      role:               user.role,
      department:         user.department,
      availabilityStatus: user.availabilityStatus,
      specializationTags: user.specializationTags,
      initials:           user.initials,
      createdAt:          user.createdAt,
    },
  });
};

/* ────────────────────────────────────────────
   POST /api/auth/register
   ──────────────────────────────────────────── */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, specializationTags, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError('Name, email, and password are required.', 400);
  }

  // Only admin can create agent/admin accounts
  if ((role === 'agent' || role === 'admin') && (!req.user || req.user.role !== 'admin')) {
    throw new ApiError('Only an admin can register agent or admin accounts.', 403);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new ApiError('Email is already registered.', 409);

  const user = await User.create({
    name,
    email,
    password,
    role:               role || 'customer',
    department:         department || null,
    specializationTags: specializationTags || [],
    phone:              phone || null,
  });

  sendToken(user, 201, res);
});

/* ────────────────────────────────────────────
   POST /api/auth/login
   ──────────────────────────────────────────── */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Email and password are required.', 400);
  }

  // Explicitly select password (hidden by default)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new ApiError('Invalid email or password.', 401);

  if (!user.isActive) throw new ApiError('Account has been deactivated. Contact support.', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError('Invalid email or password.', 401);

  // If agent, mark as online
  if (user.role === 'agent' && user.availabilityStatus === 'offline') {
    user.availabilityStatus = 'online';
    await user.save({ validateBeforeSave: false });
  }

  sendToken(user, 200, res);
});

/* ────────────────────────────────────────────
   GET /api/auth/me
   (protected route — user attached by middleware)
   ──────────────────────────────────────────── */
exports.getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/* ────────────────────────────────────────────
   PATCH /api/auth/me/availability
   Agent updates their availability status
   ──────────────────────────────────────────── */
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { availabilityStatus } = req.body;
  const VALID = ['online', 'away', 'offline'];

  if (!VALID.includes(availabilityStatus)) {
    throw new ApiError(`availabilityStatus must be one of: ${VALID.join(', ')}`, 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { availabilityStatus },
    { new: true, runValidators: true }
  );

  // Emit status change via socket
  const io = req.app.get('io');
  if (io) io.to(`dept:${user.department}`).emit('agent:availabilityChanged', {
    agentId: user._id,
    name: user.name,
    status: availabilityStatus,
  });

  res.json({ success: true, availabilityStatus: user.availabilityStatus });
});
