/**
 * server.js — TicketAI Backend Entry Point
 * Express + Socket.io + MongoDB
 */
require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const connectDB  = require('./config/db');
const { initSocket } = require('./sockets');

// ── Route imports ──
const authRoutes   = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes   = require('./routes/users');

// ── Error handler ──
const { errorHandler } = require('./middleware/errorHandler');

// ── Connect to MongoDB ──
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.io — init and attach io to app so controllers can use req.app.get('io') ──
const io = initSocket(server);
app.set('io', io);

// ── Middleware ──
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev only) ──
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Health check ──
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'TicketAI API', version: '1.0.0', ts: new Date() }));

// ── API routes ──
app.use('/api/auth',    authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users',   userRoutes);

// ── 404 handler ──
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler (must be last) ──
app.use(errorHandler);

// ── Start server ──
const PORT = parseInt(process.env.PORT || '5000', 10);
server.listen(PORT, () => {
  console.log(`\n🚀  TicketAI API  →  http://localhost:${PORT}`);
  console.log(`🌍  Environment   →  ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️   MongoDB       →  ${process.env.MONGO_URI}`);
  console.log(`🔌  Socket.io     →  active`);
  console.log(`\n📋  Routes:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/tickets`);
  console.log(`   POST   /api/tickets`);
  console.log(`   GET    /api/tickets/:id`);
  console.log(`   PATCH  /api/tickets/:id/accept`);
  console.log(`   PATCH  /api/tickets/:id/status`);
  console.log(`   POST   /api/tickets/:id/reply`);
  console.log(`   PATCH  /api/tickets/:id/escalate`);
  console.log(`   GET    /api/users/agents\n`);
});

module.exports = { app, server };
