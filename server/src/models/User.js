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
    },
    // New Feature: Commute Scanning
    commuteHistory: [
      {
        origin: String,
        destination: String,
        transportMode: {
          type: String,
          enum: ['bus', 'metro', 'train', 'unknown'],
          default: 'unknown'
        },
        carbonSaved: Number,
        pointsAwarded: Number,
        scannedAt: { type: Date, default: Date.now }
      }
    ]
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
  // Ensure totals are rounded to avoid long decimals (e.g. 23.660000001)
  this.totalCarbonSaved = Number(this.totalCarbonSaved.toFixed(3));
  this.totalRupeesSaved = Number(this.totalRupeesSaved.toFixed(2));

  // Base score: 0-100 mapped from carbon saved
  // Denominator reduced to 250kg to make it feel more rewarding for new users
  const carbonScore = Math.min(80, (this.totalCarbonSaved / 250) * 80);
  
  // Streak bonus: up to 20 pts for 14-day streak (reduced from 30 to be more attainable)
  const streakScore = Math.min(20, (this.currentStreak / 14) * 20);
  
  this.ecoScore = Math.round(carbonScore + streakScore);
};

module.exports = mongoose.model('User', UserSchema);
