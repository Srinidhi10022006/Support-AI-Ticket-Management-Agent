/**
 * controllers/userController.js — User management (agents list, profile update)
 */
const User   = require('../models/User');
const Ticket = require('../models/Ticket');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/* ────────────────────────────────────────────
   GET /api/users/agents
   List all agents (optionally filter by dept)
   ──────────────────────────────────────────── */
exports.getAgents = asyncHandler(async (req, res) => {
  const { department, availability } = req.query;
  const filter = { role: 'agent' };

  if (department)  filter.department         = department;
  if (availability) filter.availabilityStatus = availability;

  const agents = await User.find(filter)
    .select('name email department specializationTags availabilityStatus createdAt')
    .lean();

  res.json({ success: true, count: agents.length, agents });
});

/* ────────────────────────────────────────────
   GET /api/users/:id
   Get single user profile
   ──────────────────────────────────────────── */
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError('User not found.', 404);

  // Non-admins can only see their own profile
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    throw new ApiError('Access denied.', 403);
  }

  res.json({ success: true, user });
});

/* ────────────────────────────────────────────
   PATCH /api/users/me
   Update own profile (name, phone, tags, dept)
   ──────────────────────────────────────────── */
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'specializationTags', 'department'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
});

/* ────────────────────────────────────────────
   GET /api/users/me/stats
   Agent's personal performance stats
   ──────────────────────────────────────────── */
exports.getMyStats = asyncHandler(async (req, res) => {
  if (req.user.role === 'customer') {
    // Customer stats: their ticket counts
    const [open, inprogress, resolved, closed] = await Promise.all([
      Ticket.countDocuments({ customerId: req.user._id, status: 'Open' }),
      Ticket.countDocuments({ customerId: req.user._id, status: 'In Progress' }),
      Ticket.countDocuments({ customerId: req.user._id, status: 'Resolved' }),
      Ticket.countDocuments({ customerId: req.user._id, status: 'Closed' }),
    ]);
    return res.json({ success: true, stats: { open, inprogress, resolved, closed } });
  }

  // Agent stats
  const agentId = req.user._id;
  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());

  const [total, open, inprogress, resolvedToday, resolvedWeek, breached] = await Promise.all([
    Ticket.countDocuments({ assignedAgentId: agentId }),
    Ticket.countDocuments({ assignedAgentId: agentId, status: 'Open' }),
    Ticket.countDocuments({ assignedAgentId: agentId, status: 'In Progress' }),
    Ticket.countDocuments({ assignedAgentId: agentId, status: { $in: ['Resolved','Closed'] }, resolvedAt: { $gte: today } }),
    Ticket.countDocuments({ assignedAgentId: agentId, status: { $in: ['Resolved','Closed'] }, resolvedAt: { $gte: weekStart } }),
    Ticket.countDocuments({ assignedAgentId: agentId, slaBreached: true }),
  ]);

  // Average resolution time (ms → hours)
  const resolvedTickets = await Ticket.find({
    assignedAgentId: agentId,
    status: { $in: ['Resolved', 'Closed'] },
    resolvedAt: { $ne: null },
  }).select('createdAt resolvedAt').lean();

  let avgResolutionHours = 0;
  if (resolvedTickets.length) {
    const totalMs = resolvedTickets.reduce((sum, t) =>
      sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0);
    avgResolutionHours = +(totalMs / resolvedTickets.length / 3600000).toFixed(1);
  }

  res.json({
    success: true,
    stats: {
      total, open, inprogress,
      resolvedToday, resolvedWeek,
      breached,
      avgResolutionHours,
      slaCompliancePct: total > 0 ? +(((total - breached) / total) * 100).toFixed(1) : 100,
    },
  });
});

/* ────────────────────────────────────────────
   GET /api/users/agents/available
   List online agents for escalation target list
   ──────────────────────────────────────────── */
exports.getAvailableAgents = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const filter = { role: 'agent', availabilityStatus: 'online' };
  if (department) filter.department = department;

  const agents = await User.find(filter)
    .select('name department specializationTags availabilityStatus')
    .lean();

  res.json({ success: true, agents });
});
