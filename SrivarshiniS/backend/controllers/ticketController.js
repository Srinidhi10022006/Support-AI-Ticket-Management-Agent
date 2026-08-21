/**
 * controllers/ticketController.js — All ticket business logic
 */
const Ticket = require('../models/Ticket');
const User   = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/* ── Helper: emit socket event safely ── */
const emit = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);   // targeted emits happen in specific handlers
};

/* ── Simple AI classification mock (replace with real AI later) ── */
const runAIAnalysis = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  const CAT_RULES = [
    { cat: 'Network',  keywords: ['wifi','wi-fi','internet','vpn','network','bandwidth','router','ethernet','offline','dns'] },
    { cat: 'Software', keywords: ['software','crash','bug','outlook','browser','app','install','update','slow','freeze'] },
    { cat: 'Hardware', keywords: ['laptop','screen','printer','keyboard','mouse','device','battery','usb','hardware'] },
    { cat: 'Account',  keywords: ['password','login','account','access','locked','reset','2fa','mfa','credential'] },
    { cat: 'Payment',  keywords: ['payment','billing','invoice','refund','charge','subscription','card','transaction'] },
    { cat: 'HR',       keywords: ['leave','salary','payroll','hr','holiday','vacation','contract','resignation'] },
  ];

  const PRIORITY_SIGNALS = {
    Critical: ['outage','down completely','cannot work','blocked','emergency','breach','entire team','all users'],
    High:     ['urgent','asap','broken','failed','nobody can','not working','immediate'],
    Medium:   ['slow','intermittent','sometimes','partially','degraded'],
    Low:      ['question','wondering','when possible','minor','suggestion','nice to have'],
  };

  const NEGATIVE = ['frustrated','angry','terrible','unacceptable','ridiculous','horrible','awful','worst'];
  const POSITIVE = ['thanks','appreciate','helpful','great','excellent','perfect'];

  // Detect category
  let bestCat = 'General', bestScore = 0;
  for (const rule of CAT_RULES) {
    const score = rule.keywords.filter(k => text.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestCat = rule.cat; }
  }

  // Detect priority
  let priority = 'Medium';
  for (const [p, words] of Object.entries(PRIORITY_SIGNALS)) {
    if (words.some(w => text.includes(w))) { priority = p; break; }
  }

  // Detect sentiment
  let sentiment = 'Neutral';
  if (NEGATIVE.some(w => text.includes(w))) sentiment = 'Negative';
  else if (POSITIVE.some(w => text.includes(w))) sentiment = 'Positive';

  const confidence = Math.min(50 + bestScore * 10, 92);

  // KB suggested steps
  const KB = {
    Network:  ['Check if the issue is device-specific or affects all devices','Restart the network adapter and try reconnecting','Forget the network and reconnect with credentials','Check for AP or router logs for channel congestion','Contact IT if the issue persists after 15 minutes'],
    Software: ['Update the application to the latest version','Clear cache and temporary files','Restart the application','Check Windows Event Viewer for error codes','Reinstall the application if the issue persists'],
    Hardware: ['Check all cable connections and power status','Update device drivers from the manufacturer site','Test with replacement hardware if available','Check for physical damage or overheating','Raise a hardware replacement request'],
    Account:  ['Use the "Forgot Password" link on the login page','Check your email for the reset link (including Spam)','Ensure Caps Lock is off and credentials are correct','Contact IT to manually unlock the account','Wait 30 minutes for auto-unlock after multiple failed attempts'],
    Payment:  ['Verify card details and expiry date','Check if your bank has blocked the transaction','Try a different browser or clear cookies','Contact your bank to authorise the transaction','Submit a billing ticket with your invoice number'],
    HR:       ['Log in to the HR portal and check "My Requests"','Ensure your manager has been notified','Resubmit the request if it shows Draft status','Allow 2 business days for HR processing','Email hr@company.com if still unresolved after 3 days'],
    General:  ['Provide more detail about the issue for faster resolution','Check the Knowledge Base for self-service solutions','Contact the relevant department if you know the category'],
  };

  return {
    category:           bestCat,
    department:         bestCat,
    priority,
    sentiment,
    aiConfidence:       confidence,
    aiSuggestedSolution: KB[bestCat] || KB.General,
    aiDraftReply:       `Hi, thank you for contacting support. I can see you're experiencing a ${bestCat.toLowerCase()} issue. I'm investigating this now and will update you shortly.`,
  };
};

/* ────────────────────────────────────────────
   POST /api/tickets
   Customer creates a ticket
   ──────────────────────────────────────────── */
exports.createTicket = asyncHandler(async (req, res) => {
  const { title, description, attachments } = req.body;

  if (!title || !description) {
    throw new ApiError('Title and description are required.', 400);
  }

  // Run AI analysis
  const ai = runAIAnalysis(title, description);

  const ticket = await Ticket.create({
    title:              title.trim(),
    description:        description.trim(),
    customerId:         req.user._id,
    customerName:       req.user.name,
    customerEmail:      req.user.email || '',
    department:         ai.department,
    category:           ai.category,
    priority:           ai.priority,
    sentiment:          ai.sentiment,
    aiConfidence:       ai.aiConfidence,
    aiSuggestedSolution: ai.aiSuggestedSolution,
    aiDraftReply:       ai.aiDraftReply,
    attachments:        attachments || [],
    timeline: [{
      actorType: 'customer',
      actorName: req.user.name,
      actorId:   req.user._id,
      action:    'created',
      message:   'Ticket created by customer.',
    }, {
      actorType: 'ai_bot',
      actorName: 'AI Assistant',
      action:    'status_changed',
      message:   `AI classified as ${ai.category} · ${ai.priority} priority · ${ai.aiConfidence}% confidence`,
      meta: { category: ai.category, priority: ai.priority, confidence: ai.aiConfidence },
    }],
  });

  // Notify all agents in that department
  const io = req.app.get('io');
  if (io) {
    io.to(`dept:${ticket.department}`).emit('ticket:created', {
      ticketId:   ticket.ticketId,
      id:         ticket._id,
      title:      ticket.title,
      priority:   ticket.priority,
      category:   ticket.category,
      sentiment:  ticket.sentiment,
      department: ticket.department,
      createdAt:  ticket.createdAt,
    });
  }

  res.status(201).json({ success: true, ticket });
});

/* ────────────────────────────────────────────
   GET /api/tickets
   List tickets — agents/admins see all (filterable)
   Customers only see their own
   ──────────────────────────────────────────── */
exports.getTickets = asyncHandler(async (req, res) => {
  const {
    status, priority, category, department, sentiment,
    assignedAgentId, page = 1, limit = 20, sort = '-createdAt',
  } = req.query;

  const filter = {};

  // Customers can only see their own tickets
  if (req.user.role === 'customer') {
    filter.customerId = req.user._id;
  }

  // Agents default to their department if not filtering
  if (req.user.role === 'agent' && !department) {
    filter.department = req.user.department;
  }

  if (status)          filter.status          = status;
  if (priority)        filter.priority        = priority;
  if (category)        filter.category        = category;
  if (department)      filter.department      = department;
  if (sentiment)       filter.sentiment       = sentiment;
  if (assignedAgentId) filter.assignedAgentId = assignedAgentId;

  const skip     = (parseInt(page) - 1) * parseInt(limit);
  const total    = await Ticket.countDocuments(filter);
  const tickets  = await Ticket.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-replies -timeline')  // lighter response for list view
    .lean();

  res.json({
    success: true,
    total,
    page:    parseInt(page),
    pages:   Math.ceil(total / parseInt(limit)),
    tickets,
  });
});

/* ────────────────────────────────────────────
   GET /api/tickets/customer/:customerId
   All tickets for a specific customer
   ──────────────────────────────────────────── */
exports.getCustomerTickets = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  // A customer can only fetch their own
  if (req.user.role === 'customer' && req.user._id.toString() !== customerId) {
    throw new ApiError('Access denied.', 403);
  }

  const tickets = await Ticket.find({ customerId })
    .sort('-createdAt')
    .select('-replies -timeline')
    .lean();

  res.json({ success: true, count: tickets.length, tickets });
});

/* ────────────────────────────────────────────
   GET /api/tickets/:id
   Single ticket with full timeline & replies
   ──────────────────────────────────────────── */
exports.getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).lean();
  if (!ticket) throw new ApiError('Ticket not found.', 404);

  // Customers can only see their own ticket
  if (req.user.role === 'customer' && ticket.customerId.toString() !== req.user._id.toString()) {
    throw new ApiError('Access denied.', 403);
  }

  // Filter out internal notes from customer-facing reply list
  if (req.user.role === 'customer') {
    ticket.replies = (ticket.replies || []).filter(r => r.visibleToCustomer);
  }

  res.json({ success: true, ticket });
});

/* ────────────────────────────────────────────
   PATCH /api/tickets/:id/accept
   Agent claims an unassigned ticket
   ──────────────────────────────────────────── */
exports.acceptTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError('Ticket not found.', 404);

  if (ticket.assignedAgentId) {
    throw new ApiError('Ticket is already assigned to an agent.', 409);
  }

  ticket.assignedAgentId   = req.user._id;
  ticket.assignedAgentName = req.user.name;
  ticket.status            = 'In Progress';
  ticket.timeline.push({
    actorType: 'agent',
    actorName: req.user.name,
    actorId:   req.user._id,
    action:    'accepted',
    message:   `Ticket accepted by ${req.user.name}. Status changed to In Progress.`,
    meta: { previousStatus: 'Open', newStatus: 'In Progress' },
  });
  await ticket.save();

  // Notify customer
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${ticket.customerId}`).emit('ticket:accepted', {
      ticketId:        ticket.ticketId,
      id:              ticket._id,
      agentName:       req.user.name,
      status:          'In Progress',
    });
    io.to(`ticket:${ticket.ticketId}`).emit('ticket:statusChanged', {
      ticketId: ticket.ticketId,
      status:   'In Progress',
      agentName: req.user.name,
    });
  }

  res.json({ success: true, message: `Ticket ${ticket.ticketId} accepted.`, ticket });
});

/* ────────────────────────────────────────────
   PATCH /api/tickets/:id/status
   Agent/Admin updates ticket status
   ──────────────────────────────────────────── */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, resolutionSummary } = req.body;
  const VALID = ['In Progress', 'Waiting', 'Resolved', 'Closed'];
  if (!VALID.includes(status)) {
    throw new ApiError(`Invalid status. Must be one of: ${VALID.join(', ')}`, 400);
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError('Ticket not found.', 404);

  const previousStatus = ticket.status;
  ticket.status = status;

  if (status === 'Resolved' || status === 'Closed') {
    ticket.resolvedAt        = new Date();
    ticket.resolutionSummary = resolutionSummary || '';
  }

  ticket.timeline.push({
    actorType: req.user.role === 'agent' ? 'agent' : 'system',
    actorName: req.user.name,
    actorId:   req.user._id,
    action:    status === 'Resolved' ? 'resolved' : status === 'Closed' ? 'closed' : 'status_changed',
    message:   `Status changed from "${previousStatus}" to "${status}"${resolutionSummary ? ': ' + resolutionSummary : ''}.`,
    meta: { previousStatus, newStatus: status },
  });
  await ticket.save();

  const io = req.app.get('io');
  if (io) {
    const payload = { ticketId: ticket.ticketId, id: ticket._id, status, previousStatus };
    io.to(`user:${ticket.customerId}`).emit('ticket:statusChanged', payload);
    io.to(`ticket:${ticket.ticketId}`).emit('ticket:statusChanged', payload);
  }

  res.json({ success: true, message: `Status updated to ${status}.`, ticket });
});

/* ────────────────────────────────────────────
   POST /api/tickets/:id/reply
   Add a reply or internal note
   ──────────────────────────────────────────── */
exports.addReply = asyncHandler(async (req, res) => {
  const { message, visibleToCustomer = true, attachments } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError('Reply message is required.', 400);
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError('Ticket not found.', 404);

  // Customers can only reply to their own tickets, and cannot post internal notes
  if (req.user.role === 'customer') {
    if (ticket.customerId.toString() !== req.user._id.toString()) {
      throw new ApiError('Access denied.', 403);
    }
    // Customer replies are always visible
  }

  const isNote    = req.user.role !== 'customer' && !visibleToCustomer;
  const senderType = req.user.role === 'customer' ? 'customer' : 'agent';

  const reply = {
    senderId:          req.user._id,
    senderName:        req.user.name,
    senderType,
    message:           message.trim(),
    visibleToCustomer: req.user.role === 'customer' ? true : Boolean(visibleToCustomer),
    attachments:       attachments || [],
  };

  ticket.replies.push(reply);
  ticket.timeline.push({
    actorType: senderType,
    actorName: req.user.name,
    actorId:   req.user._id,
    action:    isNote ? 'internal_note' : 'replied',
    message:   isNote ? `Internal note added by ${req.user.name}` : `${req.user.name} replied.`,
    meta: { preview: message.slice(0, 80) },
  });

  await ticket.save();

  const savedReply = ticket.replies[ticket.replies.length - 1];

  const io = req.app.get('io');
  if (io) {
    const payload = {
      ticketId:  ticket.ticketId,
      id:        ticket._id,
      reply:     savedReply,
      isNote,
    };
    // If customer replied → notify agent
    if (senderType === 'customer') {
      if (ticket.assignedAgentId) {
        io.to(`user:${ticket.assignedAgentId}`).emit('ticket:newReply', payload);
      }
      io.to(`dept:${ticket.department}`).emit('ticket:newReply', payload);
    } else {
      // Agent replied — notify customer if visible
      if (!isNote) {
        io.to(`user:${ticket.customerId}`).emit('ticket:newReply', payload);
      }
    }
    // Anyone watching this specific ticket
    io.to(`ticket:${ticket.ticketId}`).emit('ticket:newReply', payload);
  }

  res.status(201).json({ success: true, reply: savedReply });
});

/* ────────────────────────────────────────────
   PATCH /api/tickets/:id/escalate
   Reassign ticket to a different department/agent
   ──────────────────────────────────────────── */
exports.escalateTicket = asyncHandler(async (req, res) => {
  const { department, agentId, reason } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError('Ticket not found.', 404);

  const previousDept  = ticket.department;
  const previousAgent = ticket.assignedAgentName;

  if (department) ticket.department = department;

  if (agentId) {
    const newAgent = await User.findById(agentId).select('name role department');
    if (!newAgent || newAgent.role !== 'agent') throw new ApiError('Target agent not found.', 404);
    ticket.assignedAgentId   = newAgent._id;
    ticket.assignedAgentName = newAgent.name;
    ticket.department        = newAgent.department || ticket.department;
  } else {
    // Unassign so any agent in the new dept can pick it up
    ticket.assignedAgentId   = null;
    ticket.assignedAgentName = null;
  }

  ticket.timeline.push({
    actorType: 'agent',
    actorName: req.user.name,
    actorId:   req.user._id,
    action:    'escalated',
    message:   reason || `Escalated from ${previousDept} to ${ticket.department}.`,
    meta: { previousDept, newDept: ticket.department, previousAgent },
  });
  await ticket.save();

  const io = req.app.get('io');
  if (io) {
    const payload = {
      ticketId:   ticket.ticketId,
      id:         ticket._id,
      department: ticket.department,
      agentName:  ticket.assignedAgentName,
      reason:     reason || '',
    };
    io.to(`dept:${ticket.department}`).emit('ticket:escalated', payload);
    io.to(`user:${ticket.customerId}`).emit('ticket:escalated', payload);
    if (agentId) io.to(`user:${agentId}`).emit('ticket:escalated', payload);
  }

  res.json({ success: true, message: 'Ticket escalated.', ticket });
});

/* ────────────────────────────────────────────
   PATCH /api/tickets/:id/customer-resolve
   Customer confirms their own ticket is resolved.
   - Only accessible to customers
   - Must own the ticket (customerId matches)
   - Ticket must be Open or In Progress
   ──────────────────────────────────────────── */
exports.customerResolve = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError('Ticket not found.', 404);

  // Ownership check — customer can only resolve their own ticket
  if (ticket.customerId.toString() !== req.user._id.toString()) {
    throw new ApiError('Access denied. You can only resolve your own tickets.', 403);
  }

  // Status guard — only allow from Open or In Progress
  const allowedStatuses = ['Open', 'In Progress'];
  if (!allowedStatuses.includes(ticket.status)) {
    throw new ApiError(
      `Cannot resolve a ticket that is already "${ticket.status}". Only Open or In Progress tickets can be customer-resolved.`,
      400
    );
  }

  const previousStatus = ticket.status;
  ticket.status     = 'Resolved';
  ticket.resolvedAt = new Date();
  ticket.resolutionSummary = 'Customer confirmed the issue is resolved.';

  ticket.timeline.push({
    actorType: 'customer',
    actorName: req.user.name,
    actorId:   req.user._id,
    action:    'resolved',
    message:   'Customer confirmed issue resolved.',
    meta: { previousStatus, newStatus: 'Resolved' },
  });

  await ticket.save();

  // Emit socket events so assigned agent and anyone watching the ticket room get notified
  const io = req.app.get('io');
  if (io) {
    const payload = {
      ticketId:     ticket.ticketId,
      id:           ticket._id,
      status:       'Resolved',
      previousStatus,
      resolvedBy:   'customer',
      customerName: req.user.name,
    };
    // Notify agent's personal room if assigned
    if (ticket.assignedAgentId) {
      io.to(`user:${ticket.assignedAgentId}`).emit('ticket:statusChanged', payload);
    }
    // Notify the entire department room
    io.to(`dept:${ticket.department}`).emit('ticket:statusChanged', payload);
    // Notify anyone watching the specific ticket room
    io.to(`ticket:${ticket.ticketId}`).emit('ticket:statusChanged', payload);
  }

  res.json({
    success: true,
    message: 'Ticket marked as resolved by customer.',
    ticket,
  });
});
