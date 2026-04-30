/**
 * dashboardController.js
 *
 * GET /api/dashboard/metrics      - Unified user, chart and recent activity payload
 * GET /api/dashboard/leaderboard  - Top 10 users by Eco-Score (Redis cached)
 * GET /api/dashboard/activity     - Paginated recent activity log
 *
 * Every metric is computed from real ActivityLog documents – no synthetic seeding.
 */

const mongoose = require('mongoose');

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { get, set } = require('../services/RedisService');
const { CACHE } = require('../config/constants');

const ensureDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database is currently unavailable. Please retry shortly.' });
    return false;
  }
  return true;
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  ecoScore: user.ecoScore || 0,
  currentStreak: user.currentStreak || 0,
  totalCarbonSaved: Number((user.totalCarbonSaved || 0).toFixed(3)),
  totalRupeesSaved: Number((user.totalRupeesSaved || 0).toFixed(2)),
  ecoPoints: user.ecoPoints || 0,
  avatarUrl:
    user.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
  createdAt: user.createdAt
});

const getMetrics = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const userId = req.userId;
    const period = req.query.period || 'monthly';

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [chartData, recentActivity] = await Promise.all([
      generateChartDataFromDB(userId, period),
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(10).lean()
    ]);

    res.json({
      user: sanitizeUser(user),
      chartData,
      recentActivity
    });
  } catch (err) {
    console.error('[dashboardController] getMetrics error:', err);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const cacheKey = 'leaderboard:global';
    const cached = await get(cacheKey);
    if (cached) {
      return res.json({ data: JSON.parse(cached), fromCache: true });
    }

    // Only show users that actually have activity – avoid showing zero-score signups as ranks
    const users = await User.find({
      $or: [
        { ecoScore: { $gt: 0 } },
        { totalCarbonSaved: { $gt: 0 } }
      ]
    })
      .sort({ ecoScore: -1, totalCarbonSaved: -1 })
      .limit(10)
      .lean();

    const leaderboard = users.map((u, i) => ({
      id: u._id,
      rank: i + 1,
      name: u.name,
      score: u.ecoScore || 0,
      streak: u.currentStreak || 0,
      carbonSaved: Number((u.totalCarbonSaved || 0).toFixed(2)),
      avatar:
        u.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`
    }));

    await set(cacheKey, JSON.stringify(leaderboard), 30);
    res.json({ data: leaderboard, fromCache: false });
  } catch (err) {
    console.error('[dashboardController] getLeaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

const getActivity = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const data = await ActivityLog.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ data });
  } catch (err) {
    console.error('[dashboardController] getActivity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
};

// ---- Helpers ----

/**
 * Generates time-bucketed chart data from real ActivityLog documents.
 * Returns a continuous series so the chart never has gaps.
 */
const generateChartDataFromDB = async (userId, period) => {
  const now = new Date();
  let days;
  let groupFormat;

  switch (period) {
    case 'weekly':
      days = 7;
      groupFormat = '%Y-%m-%d';
      break;
    case 'yearly':
      days = 12;
      groupFormat = '%Y-%m';
      break;
    default:
      days = 30;
      groupFormat = '%Y-%m-%d';
  }

  const startDate = new Date();
  if (period === 'yearly') {
    startDate.setMonth(now.getMonth() - 11);
    startDate.setDate(1);
  } else {
    startDate.setDate(now.getDate() - (days - 1));
  }
  startDate.setHours(0, 0, 0, 0);

  const aggregation = await ActivityLog.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId.toString()),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$timestamp' } },
        co2Emitted: {
          $sum: { $cond: [{ $gt: ['$carbonImpact', 0] }, '$carbonImpact', 0] }
        },
        co2Saved: {
          $sum: { $cond: [{ $lt: ['$carbonImpact', 0] }, { $abs: '$carbonImpact' }, 0] }
        },
        costSaved: {
          $sum: { $cond: [{ $lt: ['$costImpact', 0] }, { $abs: '$costImpact' }, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const dataMap = new Map(aggregation.map((item) => [item._id, item]));

  const fullData = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    if (period === 'yearly') {
      d.setMonth(startDate.getMonth() + i);
    } else {
      d.setDate(startDate.getDate() + i);
    }

    const iso = d.toISOString();
    const key = period === 'yearly' ? iso.substring(0, 7) : iso.substring(0, 10);
    const entry = dataMap.get(key) || { co2Emitted: 0, co2Saved: 0, costSaved: 0 };

    fullData.push({
      date: key,
      co2: Number(entry.co2Emitted.toFixed(3)),
      saved: Number(entry.co2Saved.toFixed(3)),
      cost: Number(entry.costSaved.toFixed(2))
    });
  }

  return fullData;
};

module.exports = { getMetrics, getLeaderboard, getActivity };
