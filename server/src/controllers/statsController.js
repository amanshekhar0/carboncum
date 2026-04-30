/**
 * statsController.js
 *
 * GET /api/stats/global
 *
 * Returns truthful, real-time platform metrics computed from MongoDB.
 * Used by the public landing page – never returns inflated/fake numbers.
 */

const mongoose = require('mongoose');

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { get, set } = require('../services/RedisService');

const getGlobalStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Truthful fallback – we cannot lie when DB is down
      return res.json({
        totalUsers: 0,
        totalCarbonSavedKg: 0,
        totalRupeesSaved: 0,
        totalActivities: 0,
        averageEcoScore: 0,
        offline: true
      });
    }

    const cacheKey = 'stats:global';
    const cached = await get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const [userCount, activityAgg, scoreAgg] = await Promise.all([
      User.countDocuments({}),
      ActivityLog.aggregate([
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            carbonSaved: {
              $sum: { $cond: [{ $lt: ['$carbonImpact', 0] }, { $abs: '$carbonImpact' }, 0] }
            },
            rupeesSaved: {
              $sum: { $cond: [{ $lt: ['$costImpact', 0] }, { $abs: '$costImpact' }, 0] }
            }
          }
        }
      ]),
      User.aggregate([
        { $match: { ecoScore: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$ecoScore' } } }
      ])
    ]);

    const activity = activityAgg[0] || { totalActivities: 0, carbonSaved: 0, rupeesSaved: 0 };
    const avgScore = scoreAgg[0]?.avg || 0;

    const payload = {
      totalUsers: userCount,
      totalCarbonSavedKg: Number(activity.carbonSaved.toFixed(2)),
      totalRupeesSaved: Number(activity.rupeesSaved.toFixed(2)),
      totalActivities: activity.totalActivities,
      averageEcoScore: Math.round(avgScore)
    };

    await set(cacheKey, JSON.stringify(payload), 60);
    res.json(payload);
  } catch (err) {
    console.error('[statsController] getGlobalStats error:', err);
    res.status(500).json({ error: 'Failed to compute platform stats' });
  }
};

module.exports = { getGlobalStats };
