const mongoose = require('mongoose');

/**
 * UserSchema
 * Represents a CarbonTwin user (employee or individual).
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false // Don't return password by default
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    // Cumulative savings since account creation
    totalCarbonSaved: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRupeesSaved: {
      type: Number,
      default: 0,
      min: 0
    },
    // Gamification
    ecoScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    // P2P trading
    ecoPoints: {
      type: Number,
      default: 100
    }
  },
  {
    timestamps: true // Adds createdAt, updatedAt
  }
);

// Index for leaderboard queries
UserSchema.index({ organizationId: 1, ecoScore: -1 });

/**
 * Recomputes the ecoScore based on carbon saved and streak.
 * Called after each activity ingestion.
 */
UserSchema.methods.recalculateEcoScore = function () {
  // Base score: 0-100 mapped from carbon saved (0-500kg = 0-80 pts)
  const carbonScore = Math.min(80, (this.totalCarbonSaved / 500) * 80);
  // Streak bonus: up to 20 pts for 30-day streak
  const streakScore = Math.min(20, (this.currentStreak / 30) * 20);
  this.ecoScore = Math.round(carbonScore + streakScore);
};

module.exports = mongoose.model('User', UserSchema);
