/**
 * models/User.js — User Mongoose schema
 * Roles: customer | agent | admin
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,       // never returned by default
    },
    role: {
      type: String,
      enum: ['customer', 'agent', 'admin'],
      default: 'customer',
    },
    // ── Agent-specific fields ──
    department: {
      type: String,
      enum: ['Network', 'Software', 'Hardware', 'Account', 'Payment', 'HR', 'General'],
      default: null,
    },
    specializationTags: {
      type: [String],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: ['online', 'away', 'offline'],
      default: 'offline',
    },
    // ── Customer-specific fields ──
    phone: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,   // adds createdAt, updatedAt
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Hash password before saving ──
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare plaintext password with hash ──
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: initials ──
userSchema.virtual('initials').get(function () {
  const parts = (this.name || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

// ── Index ──
userSchema.index({ email: 1 });
userSchema.index({ role: 1, department: 1 });

module.exports = mongoose.model('User', userSchema);
