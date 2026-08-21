/**
 * models/Ticket.js — Ticket Mongoose schema
 * Core ticket document with embedded replies and timeline
 */
const mongoose = require('mongoose');

/* ── Reply sub-schema ── */
const replySchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, required: true },
    senderType: { type: String, enum: ['customer', 'agent', 'ai_bot'], required: true },
    message: { type: String, required: true, maxlength: 5000 },
    visibleToCustomer: { type: Boolean, default: true },   // false = internal note
    attachments: [{ type: String }],                        // file URLs
  },
  { timestamps: true }
);

/* ── Timeline/Activity sub-schema ── */
const timelineSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      enum: ['customer', 'agent', 'ai_bot', 'system'],
      required: true,
    },
    actorName: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: {
      type: String,
      enum: [
        'created', 'replied', 'internal_note',
        'status_changed', 'accepted', 'escalated',
        'resolved', 'closed', 'reopened',
      ],
      required: true,
    },
    message: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra info (e.g. old/new status)
  },
  { timestamps: true }
);

/* ── Auto-generate ticketId counter ── */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

/* ── Main Ticket schema ── */
const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      // e.g. TKT-001 — set in pre-save hook
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },

    // ── Customer info ──
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },

    // ── Classification (set by AI or agent) ──
    department: {
      type: String,
      enum: ['Network', 'Software', 'Hardware', 'Account', 'Payment', 'HR', 'General'],
      default: 'General',
    },
    category: {
      type: String,
      enum: ['Network', 'Software', 'Hardware', 'Account', 'Payment', 'HR', 'General'],
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral',
    },

    // ── AI analysis ──
    aiConfidence: { type: Number, default: 0, min: 0, max: 100 },
    aiSuggestedSolution: { type: [String], default: [] },
    aiDraftReply: { type: String, default: '' },

    // ── Status & assignment ──
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAgentName: { type: String, default: null },

    // ── Attachments (URLs) ──
    attachments: [{ type: String }],

    // ── SLA ──
    slaDeadline: { type: Date, default: null },  // computed on create
    slaBreached: { type: Boolean, default: false },

    // ── Resolution ──
    resolvedAt: { type: Date, default: null },
    resolutionSummary: { type: String, default: '' },

    // ── Embedded sub-docs ──
    replies: [replySchema],
    timeline: [timelineSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_doc, ret) { delete ret.__v; return ret; } },
  }
);

/* ── Auto-generate ticketId (TKT-001, TKT-002…) ── */
ticketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketId) {
    const counter = await Counter.findByIdAndUpdate(
      'ticketId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.ticketId = `TKT-${String(counter.seq).padStart(3, '0')}`;
  }
  // Auto-set SLA deadline based on priority
  if (this.isNew && !this.slaDeadline) {
    const hours = { Critical: 2, High: 8, Medium: 24, Low: 72 };
    const h = hours[this.priority] || 24;
    this.slaDeadline = new Date(Date.now() + h * 60 * 60 * 1000);
  }
  next();
});

/* ── Virtual: SLA time remaining (ms) ── */
ticketSchema.virtual('slaTimeRemaining').get(function () {
  if (!this.slaDeadline) return null;
  return this.slaDeadline.getTime() - Date.now();
});

/* ── Indexes ── */
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ customerId: 1 });
ticketSchema.index({ assignedAgentId: 1, status: 1 });
ticketSchema.index({ department: 1, status: 1 });
ticketSchema.index({ priority: 1, createdAt: -1 });
ticketSchema.index({ status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
