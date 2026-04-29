const mongoose = require('mongoose');

/**
 * SuggestionSchema
 * AI-generated actionable suggestions for users.
 * Created by the daily nudge cron job via Groq.
 */
const SuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    suggestionText: {
      type: String,
      required: true
    },
    potentialSavingsKg: {
      type: Number,
      default: 0
    },
    potentialSavingsInr: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      enum: ['Browser', 'Hardware', 'Lifestyle'],
      default: 'Browser'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'ignored'],
      default: 'pending'
    },
    // When the user acted on this suggestion
    actionedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Get only latest suggestions per user
SuggestionSchema.index({ userId: 1, createdAt: -1 });
SuggestionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Suggestion', SuggestionSchema);
