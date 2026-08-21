/**
 * sockets/index.js — Socket.io initialisation and event handlers
 *
 * Room naming conventions:
 *   user:{userId}          — private room for one user (customer or agent)
 *   dept:{departmentName}  — all agents in a department (e.g. "dept:Network")
 *   ticket:{ticketId}      — anyone actively viewing a specific ticket (e.g. "ticket:TKT-001")
 */
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  /* ── Auth middleware for Socket.io ── */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        // Allow unauthenticated connections (guest tracking, etc.)
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      // Don't block unauthenticated sockets fully — just mark as null
      socket.user = null;
      next();
    }
  });

  /* ── Connection handler ── */
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${socket.id}` + (user ? ` (${user.name} / ${user.role})` : ' (guest)'));

    /* ── Auto-join rooms on connect ── */
    if (user) {
      // Every authenticated user gets their own private room
      socket.join(`user:${user._id}`);
      console.log(`   📬 Joined room: user:${user._id}`);

      if (user.role === 'agent' && user.department) {
        socket.join(`dept:${user.department}`);
        console.log(`   🏢 Joined room: dept:${user.department}`);
      }

      if (user.role === 'admin') {
        // Admin joins all department rooms
        const DEPTS = ['Network','Software','Hardware','Account','Payment','HR','General'];
        DEPTS.forEach(d => socket.join(`dept:${d}`));
        console.log(`   👑 Admin joined all dept rooms`);
      }
    }

    /* ────────────────────────────────────────
       CLIENT EVENTS
    ──────────────────────────────────────── */

    /* ── Join a ticket room (agent/customer opens a ticket page) ── */
    socket.on('ticket:join', ({ ticketId }) => {
      if (!ticketId) return;
      socket.join(`ticket:${ticketId}`);
      console.log(`   🎫 ${socket.id} joined room: ticket:${ticketId}`);
    });

    /* ── Leave a ticket room ── */
    socket.on('ticket:leave', ({ ticketId }) => {
      if (!ticketId) return;
      socket.leave(`ticket:${ticketId}`);
    });

    /* ── Join a custom department room (used by agent who switched dept) ── */
    socket.on('dept:join', ({ department }) => {
      if (!department) return;
      socket.join(`dept:${department}`);
    });

    /* ── Typing indicators (within a ticket room) ── */
    socket.on('ticket:typing', ({ ticketId, isTyping }) => {
      socket.to(`ticket:${ticketId}`).emit('ticket:typing', {
        userId: user?._id,
        name:   user?.name || 'Someone',
        isTyping,
      });
    });

    /* ── Agent sets availability from the client side ── */
    socket.on('agent:setAvailability', async ({ status }) => {
      if (!user || user.role !== 'agent') return;
      const VALID = ['online','away','offline'];
      if (!VALID.includes(status)) return;

      try {
        await User.findByIdAndUpdate(user._id, { availabilityStatus: status });
        io.to(`dept:${user.department}`).emit('agent:availabilityChanged', {
          agentId: user._id,
          name:    user.name,
          status,
        });
      } catch (e) { console.error('Availability update error:', e.message); }
    });

    /* ── Ping / heartbeat ── */
    socket.on('ping', (cb) => { if (typeof cb === 'function') cb({ ts: Date.now() }); });

    /* ── Disconnect ── */
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

/* ── Export getIo so controllers can access the socket instance ── */
const getIo = () => {
  if (!io) throw new Error('Socket.io not initialised. Call initSocket() first.');
  return io;
};

module.exports = { initSocket, getIo };
