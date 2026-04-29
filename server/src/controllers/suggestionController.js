/**
 * suggestionController.js
 * 
 * GET  /api/suggestions       - Get pending suggestions for user
 * PATCH /api/suggestions/:id  - Accept or dismiss a suggestion
 * POST /api/suggestions/generate - Manually trigger AI suggestion generation
 */

const Suggestion = require('../models/Suggestion');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { generateDailySuggestions } = require('../services/AIService');

const DEMO_USER_ID = process.env.DEMO_USER_ID;

const getSuggestions = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection.readyState === 1;
    const userId = req.query.userId || DEMO_USER_ID;

    let suggestions = [];

    if (isDbConnected) {
      suggestions = await Suggestion.find({ userId, status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      if (suggestions.length === 0) {
        suggestions = await generateAndSaveSuggestions(userId);
      }
    } else {
      // DB DOWN: Generate non-persisted suggestions via AI
      const mockUser = { name: 'Demo User', ecoScore: 50, currentStreak: 2 };
      const aiSuggestions = await generateDailySuggestions(mockUser, []);
      suggestions = aiSuggestions.map((s, i) => ({
        _id: `mock_suggestion_${i}`,
        suggestionText: s.suggestionText,
        potentialSavingsKg: s.potentialSavingsKg,
        potentialSavingsInr: s.potentialSavingsInr,
        category: s.category,
        status: 'pending',
        createdAt: new Date()
      }));
    }

    res.json(suggestions.map((s) => ({
      id: s._id,
      text: s.suggestionText,
      potentialSavingsKg: s.potentialSavingsKg,
      potentialSavingsInr: s.potentialSavingsInr,
      category: s.category,
      status: s.status,
      createdAt: s.createdAt
    })));
  } catch (err) {
    console.error('[suggestionController] getSuggestions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
};

/**
 * PATCH /api/suggestions/:id
 * Body: { action: 'accept' | 'dismiss' }
 */
const actionSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['accept', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accept or dismiss' });
    }

    const status = action === 'accept' ? 'completed' : 'ignored';
    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { status, actionedAt: new Date() },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    // If accepted, log it as a positive activity
    if (action === 'accept') {
      await ActivityLog.create({
        userId: suggestion.userId,
        category: suggestion.category,
        actionName: `Accepted: ${suggestion.suggestionText.substring(0, 60)}...`,
        carbonImpact: -suggestion.potentialSavingsKg,
        costImpact: -suggestion.potentialSavingsInr,
        rawData: { suggestionId: id }
      });

      // Update user totals
      await User.findByIdAndUpdate(suggestion.userId, {
        $inc: {
          totalCarbonSaved: suggestion.potentialSavingsKg,
          totalRupeesSaved: suggestion.potentialSavingsInr
        }
      });
    }

    res.json({ success: true, id, action, status });
  } catch (err) {
    console.error('[suggestionController] actionSuggestion error:', err.message);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
};

/**
 * POST /api/suggestions/generate
 * Manually triggers AI suggestion generation for the user
 */
const generateSuggestions = async (req, res) => {
  try {
    const userId = req.body.userId || DEMO_USER_ID;
    const suggestions = await generateAndSaveSuggestions(userId);
    res.json({ success: true, count: suggestions.length, suggestions });
  } catch (err) {
    console.error('[suggestionController] generateSuggestions error:', err.message);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

// ---- Helper ----

const generateAndSaveSuggestions = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  // Get last 7 days of activity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const activityLogs = await ActivityLog.find({
    userId,
    timestamp: { $gte: sevenDaysAgo }
  }).sort({ timestamp: -1 }).limit(20).lean();

  // Call Groq to generate suggestions
  const aiSuggestions = await generateDailySuggestions(user, activityLogs);

  // Save to DB
  const saved = await Suggestion.insertMany(
    aiSuggestions.map((s) => ({
      userId,
      suggestionText: s.suggestionText,
      potentialSavingsKg: s.potentialSavingsKg || 0,
      potentialSavingsInr: s.potentialSavingsInr || 0,
      category: s.category || 'Browser',
      status: 'pending'
    }))
  );

  return saved;
};

module.exports = { getSuggestions, actionSuggestion, generateSuggestions };
