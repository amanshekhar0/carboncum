/**
 * chatController.js
 *
 * POST /api/chat
 * Eco-Coach chatbot powered by Groq Llama. Always uses the authenticated
 * user's real dashboard stats as context – never made-up defaults.
 */

const mongoose = require('mongoose');

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { ecoCoachChat } = require('../services/AIService');

const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'AI Coach is offline because the database is unavailable. Please retry shortly.'
      });
    }

    const user = await User.findById(req.userId)
      .select('name ecoScore totalCarbonSaved totalRupeesSaved currentStreak')
      .lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Pull last 5 actions to give the coach concrete recent context
    const recent = await ActivityLog.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const dashboardStats = {
      name: user.name,
      ecoScore: user.ecoScore || 0,
      totalCarbonSaved: Number((user.totalCarbonSaved || 0).toFixed(2)),
      totalRupeesSaved: Number((user.totalRupeesSaved || 0).toFixed(2)),
      currentStreak: user.currentStreak || 0,
      recentActions: recent.map((r) => ({
        category: r.category,
        action: r.actionName,
        carbonImpact: Number(r.carbonImpact.toFixed(3))
      }))
    };

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: 'AI Coach is not configured on this server (GROQ_API_KEY missing).'
      });
    }

    const reply = await ecoCoachChat(message, dashboardStats, history);
    res.json({ text: reply, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[chatController] sendMessage error:', err.message);
    res.status(500).json({ error: 'AI Coach failed to respond. Please try again shortly.' });
  }
};

module.exports = { sendMessage };
