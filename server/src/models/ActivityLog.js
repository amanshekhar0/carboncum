const mongoose = require('mongoose');

/**
 * ActivityLogSchema
 * Records every carbon-impacting action by a user.
 * Negative carbonImpact = carbon saved (good action).
 * Positive carbonImpact = carbon added (bad action).
 */
const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // The source of the activity
    category: {
      type: String,
      enum: ['Browser', 'Hardware', 'Lifestyle'],
      required: true
    },
    actionName: {
      type: String,
      required: true,
      trim: true
    },
    // Impact values (negative = savings, positive = emissions)
    carbonImpact: {
      type: Number,
      required: true // kg CO2
    },
    costImpact: {
      type: Number,
      required: true // INR ₹
    },
    // Raw payload that was processed (for debugging/auditing)
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for time-range queries per user
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
// Index for org-wide aggregations
ActivityLogSchema.index({ category: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
