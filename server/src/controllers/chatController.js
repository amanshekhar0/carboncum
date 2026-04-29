/**
 * chatController.js
 * 
 * POST /api/chat
 * Real-time chatbot powered by Groq Llama.
 * The AI has access to user's live dashboard stats.
 */

const User = require('../models/User');
const { ecoCoachChat } = require('../services/AIService');

const DEMO_USER_ID = process.env.DEMO_USER_ID;

/**
 * POST /api/chat
 * Body: { message: string, userId?: string, history?: Array }
 */
const sendMessage = async (req, res) => {
  try {
    const { message, userId, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Default stats (shown when no user in DB)
    let dashboardStats = {
      ecoScore: 50,
      totalCarbonSaved: 0,
      totalRupeesSaved: 0,
      currentStreak: 0
    };

    // Try to fetch user stats, but don't fail if DB is down
    if (userId && userId !== 'undefined' && userId !== '') {
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          const user = await User.findById(userId)
            .select('ecoScore totalCarbonSaved totalRupeesSaved currentStreak')
            .lean();
          if (user) {
            dashboardStats = {
              ecoScore: user.ecoScore,
              totalCarbonSaved: parseFloat(user.totalCarbonSaved.toFixed(2)),
              totalRupeesSaved: parseFloat(user.totalRupeesSaved.toFixed(2)),
              currentStreak: user.currentStreak
            };
          }
        }
      } catch (dbErr) {
        // Continue with default stats if DB is unavailable
        console.warn('[chatController] DB lookup skipped:', dbErr.message);
      }
    }

    // Get AI response with user context
    const reply = await ecoCoachChat(message, dashboardStats, history);

    res.json({
      text: reply,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[chatController]', err.message);
    res.status(500).json({
      text: `My AI brain is taking a breather. Meanwhile: close 10 tabs, drink water, save the planet. Come back in 30 seconds.`,
      timestamp: new Date().toISOString(),
      error: true
    });
  }
};

module.exports = { sendMessage };
