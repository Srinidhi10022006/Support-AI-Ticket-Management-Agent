# TicketAI — Backend API

> Node.js · Express · MongoDB · Socket.io · JWT

A production-ready REST API and real-time WebSocket server for the TicketAI support ticket management system.

---

## 📁 Project Structure

```
backend/
├── server.js              # Entry point
├── seed.js                # Database seeder
├── .env                   # Environment variables (copy from .env.example)
├── package.json
│
├── config/
│   └── db.js              # MongoDB connection
│
├── models/
│   ├── User.js            # User schema (customer / agent / admin)
│   └── Ticket.js          # Ticket schema (with embedded replies & timeline)
│
├── controllers/
│   ├── authController.js  # Register, Login, Me, Availability
│   ├── ticketController.js# Full ticket lifecycle + AI analysis
│   └── userController.js  # Agent list, profile, performance stats
│
├── routes/
│   ├── auth.js            # /api/auth/*
│   ├── tickets.js         # /api/tickets/*
│   └── users.js           # /api/users/*
│
├── middleware/
│   ├── auth.js            # JWT protect + role authorize
│   └── errorHandler.js    # asyncHandler, ApiError, global handler
│
└── sockets/
    └── index.js           # Socket.io rooms & event handlers
```

---

## ⚡ Quick Start

### 1. Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 18.0.0 |
| npm | 9.0.0 |
| MongoDB | 6.0 (local or Atlas) |

### 2. Install dependencies

```bash
cd backend
npm install
```

This installs:

| Package | Purpose |
|---|---|
| `express` | HTTP server & routing |
| `mongoose` | MongoDB ODM |
| `socket.io` | Real-time WebSocket events |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT authentication |
| `cors` | Cross-Origin Resource Sharing |
| `dotenv` | Environment variable loading |
| `nodemon` | Auto-restart in dev (dev dependency) |

### 3. Configure environment variables

The `.env` file is already created. Edit it with your settings:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ticketai
JWT_SECRET=ticketai_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://127.0.0.1:5500
NODE_ENV=development
```

> **MongoDB Atlas**: Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ticketai`

### 4. Run the server

**Development** (with auto-restart on file changes):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

You should see:
```
🚀  TicketAI API  →  http://localhost:5000
🌍  Environment   →  development
🗄️   MongoDB       →  mongodb://localhost:27017/ticketai
🔌  Socket.io     →  active
```

### 5. Seed the database

Populates the DB with 4 test accounts and 6 sample tickets:

```bash
npm run seed
```

Output:
```
🌱  TicketAI Database Seeder
══════════════════════════════
✅  Connected to MongoDB

👤  Creating users…
   ✅  customer | Jane Doe       (customer@ticketai.com)
   ✅  agent    | Mike Adams     (agent.network@ticketai.com)
   ✅  agent    | Sarah Chen     (agent.software@ticketai.com)
   ✅  admin    | Admin User     (admin@ticketai.com)

🎫  Creating sample tickets…
   ✅  TKT-001 | Critical | Open        | Building B Wi-Fi completely down…
   ✅  TKT-002 | High     | In Progress | Cannot access shared drives over VPN…
   ...

🎉  Seeding complete!
```

### 6. Test accounts

| Role | Email | Password | Department |
|---|---|---|---|
| Customer | `customer@ticketai.com` | `password123` | — |
| Agent | `agent.network@ticketai.com` | `password123` | Network |
| Agent | `agent.software@ticketai.com` | `password123` | Software |
| Admin | `admin@ticketai.com` | `password123` | — |

---

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new customer |
| `POST` | `/auth/login` | Public | Login & receive JWT |
| `GET` | `/auth/me` | 🔐 Any | Get current user |
| `PATCH` | `/auth/me/availability` | 🔐 Agent/Admin | Set Online/Away/Offline |

#### POST `/auth/login`
```json
// Request body
{ "email": "customer@ticketai.com", "password": "password123" }

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "Jane Doe", "role": "customer", ... }
}
```

---

### Tickets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/tickets` | 🔐 Any | Create ticket (AI analysis runs automatically) |
| `GET` | `/tickets` | 🔐 Any | List tickets (agents see dept; customers see own) |
| `GET` | `/tickets/customer/:id` | 🔐 Any | Customer's tickets |
| `GET` | `/tickets/:id` | 🔐 Any | Full ticket + timeline + replies |
| `PATCH` | `/tickets/:id/accept` | 🔐 Agent | Agent claims ticket |
| `PATCH` | `/tickets/:id/status` | 🔐 Agent | Update status |
| `POST` | `/tickets/:id/reply` | 🔐 Any | Add reply or internal note |
| `PATCH` | `/tickets/:id/escalate` | 🔐 Agent | Escalate / reassign |

#### POST `/tickets` (create)
```json
// Request — customer token required
{
  "title": "Cannot connect to office Wi-Fi",
  "description": "My laptop won't connect to the corporate Wi-Fi on the 2nd floor..."
}

// Response — AI fields populated automatically
{
  "success": true,
  "ticket": {
    "ticketId": "TKT-007",
    "category": "Network",
    "priority": "High",
    "sentiment": "Negative",
    "aiConfidence": 88,
    "aiSuggestedSolution": ["Check AP logs...", "..."],
    "status": "Open",
    ...
  }
}
```

#### POST `/tickets/:id/reply`
```json
// Agent internal note (not visible to customer)
{
  "message": "Checked AP logs — channel 6 congested. Switching to 11.",
  "visibleToCustomer": false
}

// Customer reply (visibleToCustomer always true for customers)
{ "message": "Still having the issue after reconnecting." }
```

#### PATCH `/tickets/:id/status`
```json
{
  "status": "Resolved",
  "resolutionSummary": "Restarted AP-B2-02 and switched to channel 11. Customer confirmed."
}
```

#### Query Parameters for `GET /tickets`
```
?status=Open
?priority=Critical
?category=Network
?department=Network
?sentiment=Negative
?page=1&limit=20
?sort=-createdAt   (prefix - for descending)
```

---

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/agents` | 🔐 Agent/Admin | List all agents |
| `GET` | `/users/agents/available` | 🔐 Agent/Admin | Online agents for escalation |
| `GET` | `/users/me/stats` | 🔐 Any | Performance stats |
| `PATCH` | `/users/me` | 🔐 Any | Update own profile |
| `GET` | `/users/:id` | 🔐 Any | Get user by ID |

---

## 🔌 Socket.io Events

### Connect with auth
```js
const socket = io('http://localhost:5000', {
  auth: { token: 'Bearer eyJhbGciOi...' }
});
```

### Room auto-join (on connection)
| Room | Who joins | Purpose |
|---|---|---|
| `user:{userId}` | Everyone authed | Private notifications |
| `dept:{deptName}` | Agents | Department-wide ticket events |
| `ticket:{ticketId}` | Anyone (on join event) | Live ticket updates |

### Client → Server events
| Event | Payload | Description |
|---|---|---|
| `ticket:join` | `{ ticketId }` | Start watching a ticket |
| `ticket:leave` | `{ ticketId }` | Stop watching a ticket |
| `ticket:typing` | `{ ticketId, isTyping }` | Typing indicator |
| `agent:setAvailability` | `{ status }` | Update online/away/offline |

### Server → Client events
| Event | Emitted to | Trigger |
|---|---|---|
| `ticket:created` | `dept:{dept}` | Customer creates a ticket |
| `ticket:accepted` | `user:{customerId}` | Agent accepts ticket |
| `ticket:statusChanged` | `user:{customerId}`, `ticket:{ticketId}` | Status update |
| `ticket:newReply` | Customer or agent room | Reply added |
| `ticket:escalated` | `dept:{newDept}`, `user:{customerId}` | Escalation |
| `ticket:typing` | `ticket:{ticketId}` | Typing indicator |
| `agent:availabilityChanged` | `dept:{dept}` | Agent status change |

### Frontend Socket.io example
```js
// Connect
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('ticketai_token') }
});

// Watch a ticket
socket.emit('ticket:join', { ticketId: 'TKT-001' });

// Listen for new replies in real-time
socket.on('ticket:newReply', ({ reply, ticketId }) => {
  console.log(`New reply on ${ticketId}:`, reply.message);
  // Append to the UI
});

// Listen for status changes
socket.on('ticket:statusChanged', ({ ticketId, status }) => {
  showToast(`Ticket ${ticketId} is now ${status}`);
});
```

---

## 🗄️ Data Models

### User
```
name, email, password (hashed), role (customer|agent|admin),
department, specializationTags[], availabilityStatus (online|away|offline),
phone, isActive, createdAt, updatedAt
```

### Ticket
```
ticketId (auto TKT-NNN), title, description,
customerId, customerName, customerEmail,
department, category, priority (Low|Medium|High|Critical),
sentiment (Positive|Neutral|Negative), aiConfidence,
aiSuggestedSolution[], aiDraftReply,
status (Open|In Progress|Waiting|Resolved|Closed),
assignedAgentId, assignedAgentName, attachments[],
slaDeadline (auto from priority), slaBreached, resolvedAt,
resolutionSummary, createdAt, updatedAt,
replies[] → { senderId, senderName, senderType, message, visibleToCustomer, attachments[] },
timeline[] → { actorType, actorName, actorId, action, message, meta }
```

---

## 🔒 Security Notes

- **Change `JWT_SECRET`** before deploying to production — use a 64-char random string
- **Use MongoDB Atlas** with IP allowlist in production, not local MongoDB
- **HTTPS** — run behind a reverse proxy (nginx) with SSL in production
- **Rate limiting** — add `express-rate-limit` for production
- Passwords are hashed with bcrypt (12 salt rounds)
- Passwords are never returned in API responses (`select: false`)

---

## 🧰 Troubleshooting

| Problem | Solution |
|---|---|
| `MongoDB connection error` | Ensure MongoDB is running: `mongod` or check Atlas |
| `EADDRINUSE: port 5000` | Another process on port 5000: `netstat -ano \| findstr :5000` |
| `Invalid token` errors | Re-login to get a fresh JWT — tokens expire after 7 days |
| Seed script fails | Ensure MongoDB is running first, then re-run `npm run seed` |
| CORS errors from frontend | Set `CLIENT_ORIGIN` in `.env` to your frontend URL |
