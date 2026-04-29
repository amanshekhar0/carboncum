/**
 * dashboardController.js
 * 
 * GET /api/dashboard/metrics   - Unified stats for frontend charts
 * GET /api/dashboard/leaderboard - Top 10 users, Redis cached (5-min TTL)
 * GET /api/dashboard/seed      - Creates demo data if DB is empty
 */

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Organization = require('../models/Organization');
const { get, set } = require('../services/RedisService');
const { CACHE } = require('../config/constants');

const DEMO_USER_ID = process.env.DEMO_USER_ID;

/**
 * GET /api/dashboard/metrics
 * Returns: user profile, chart data (30 days), recent activity log
 */
const getMetrics = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection.readyState === 1;

    let userId = req.query.userId || DEMO_USER_ID;
    const period = req.query.period || 'monthly';

    let user;
    let recentActivity = [];
    let chartData = [];

    if (isDbConnected) {
      user = await User.findById(userId).lean();
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is brand new (no logs)
      const logCount = await ActivityLog.countDocuments({ userId });
      if (logCount === 0) {
        console.log(`[Dashboard] Creating Welcome Bonus for new user: ${user.name}`);
        await ActivityLog.create({
          userId,
          category: 'Lifestyle',
          actionName: 'Welcome to CarbonTwin! 🌱',
          carbonImpact: -1.2,
          costImpact: -15.5,
          timestamp: new Date()
        });
        
        // Give some initial points
        await User.findByIdAndUpdate(userId, { 
          $set: { 
            ecoPoints: 50, 
            ecoScore: 65,
            totalCarbonSaved: 1.2,
            totalRupeesSaved: 15.5
          } 
        });
        
        // Refresh user object
        user.ecoPoints = 50;
        user.ecoScore = 65;
        user.totalCarbonSaved = 1.2;
        user.totalRupeesSaved = 15.5;
      }

      chartData = await generateChartDataFromDB(userId, period);
      recentActivity = await ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(10).lean();
    } else {
      return res.status(503).json({ error: 'Database disconnected' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        ecoScore: user.ecoScore || 0,
        currentStreak: user.currentStreak || 0,
        totalCarbonSaved: user.totalCarbonSaved || 0,
        totalRupeesSaved: user.totalRupeesSaved || 0,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
      },
      chartData: chartData,
      recentActivity
    });
  } catch (err) {
    console.error('[dashboardController] getMetrics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database disconnected' });
    }

    const orgId = req.query.orgId || 'default';
    const cacheKey = `leaderboard:${orgId}`;
    const cached = await get(cacheKey);
    if (cached) return res.json({ data: JSON.parse(cached), fromCache: true });

    const users = await User.find().sort({ ecoScore: -1 }).limit(10).lean();
    const leaderboard = users.map((u, i) => ({
      id: u._id, rank: i+1, name: u.name, score: u.ecoScore, streak: u.currentStreak, 
      carbonSaved: u.totalCarbonSaved, avatar: u.avatarUrl || `https://i.pravatar.cc/150?u=${u._id}`
    }));
    // Use very short TTL (10s) for better real-time feel during demo
    await set(cacheKey, JSON.stringify(leaderboard), 10);
    res.json({ data: leaderboard, fromCache: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

/**
 * GET /api/dashboard/seed
 * Seeds demo data for development. Safe to call multiple times.
 */
const seedDemo = async (req, res) => {
  try {
    const user = await seedDemoUser();
    res.json({ message: 'Demo data seeded', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---- Helpers ----

const generateChartDataFromDB = async (userId, period) => {
  const mongoose = require('mongoose');
  const now = new Date();
  let days;
  let groupFormat;
  
  switch (period) {
    case 'weekly':
      days = 7;
      groupFormat = '%Y-%m-%d';
      break;
    case 'yearly':
      days = 12; // months
      groupFormat = '%Y-%m';
      break;
    default:
      days = 30;
      groupFormat = '%Y-%m-%d';
  }

  const startDate = new Date();
  if (period === 'yearly') {
    startDate.setMonth(now.getMonth() - 11);
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
        co2: { $sum: '$carbonImpact' },
        cost: { $sum: '$costImpact' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Map aggregation to a Map for easy lookup
  const dataMap = new Map(aggregation.map(item => [item._id, item]));

  // Fill in the gaps to make the chart look full and professional
  const fullData = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    if (period === 'yearly') {
      d.setMonth(startDate.getMonth() + i);
    } else {
      d.setDate(startDate.getDate() + i);
    }
    
    const key = d.toISOString().split('T')[0].substring(0, groupFormat.includes('%m-%d') ? 10 : 7);
    const entry = dataMap.get(key) || { co2: 0, cost: 0 };

    fullData.push({
      date: key,
      co2: parseFloat(Math.abs(entry.co2).toFixed(3)),
      cost: parseFloat(Math.abs(entry.cost).toFixed(2)),
      saved: entry.co2 < 0 ? parseFloat(Math.abs(entry.co2).toFixed(3)) : 0
    });
  }

  return fullData;
};

const seedDemoUser = async () => {
  const mongoose = require('mongoose');

  // Create or find demo org
  let org = await Organization.findOne({ domain: 'startup.io' });
  if (!org) {
    org = await Organization.create({
      name: 'TechNova Solutions',
      domain: 'startup.io',
      totalEmployees: 124,
      esgComplianceScore: 72
    });
  }

  const demoId = DEMO_USER_ID
    ? new mongoose.Types.ObjectId(DEMO_USER_ID)
    : new mongoose.Types.ObjectId();

  // Use findOneAndUpdate with upsert to avoid duplicate key errors
  const user = await User.findOneAndUpdate(
    { email: 'aarav@startup.io' },
    {
      $setOnInsert: {
        _id: demoId,
        name: 'Aarav Sharma',
        email: 'aarav@startup.io',
        organizationId: org._id,
        totalCarbonSaved: 142.5,
        totalRupeesSaved: 3450.75,
        ecoScore: 84,
        currentStreak: 12,
        ecoPoints: 840,
        avatarUrl: 'https://i.pravatar.cc/150?u=aarav'
      }
    },
    { upsert: true, new: true }
  );

  // Seed some activity logs if none exist
  const existingLogs = await ActivityLog.countDocuments({ userId: user._id });
  if (existingLogs === 0) {
    await seedActivityLogs(user._id);
  }

  // Peer users removed as per user request to "make everything real"
  // await seedPeerUsers(org._id);

  return user;
};

const seedPeerUsers = async (orgId) => {
  const peers = [
    { name: 'Priya Patel', email: 'priya@startup.io', ecoScore: 98, currentStreak: 30, totalCarbonSaved: 520 },
    { name: 'Rahul Desai', email: 'rahul@startup.io', ecoScore: 95, currentStreak: 25, totalCarbonSaved: 480 },
    { name: 'Neha Gupta', email: 'neha@startup.io', ecoScore: 82, currentStreak: 8, totalCarbonSaved: 130 },
    { name: 'Vikram Singh', email: 'vikram@startup.io', ecoScore: 79, currentStreak: 5, totalCarbonSaved: 110 },
    { name: 'Ananya Reddy', email: 'ananya@startup.io', ecoScore: 76, currentStreak: 3, totalCarbonSaved: 95 },
    { name: 'Karan Malhotra', email: 'karan@startup.io', ecoScore: 71, currentStreak: 1, totalCarbonSaved: 80 }
  ];

  for (const peer of peers) {
    await User.findOneAndUpdate(
      { email: peer.email },
      { $setOnInsert: { ...peer, organizationId: orgId } },
      { upsert: true }
    );
  }
};

const seedActivityLogs = async (userId) => {
  const categories = ['Browser', 'Hardware', 'Lifestyle'];
  const actions = [
    { category: 'Browser', actionName: 'Closed 15 Zombie Tabs', carbonImpact: -0.2, costImpact: -2.5 },
    { category: 'Hardware', actionName: 'Screen Brightness Reduced 30%', carbonImpact: -0.1, costImpact: -1.2 },
    { category: 'Lifestyle', actionName: 'AC Thermostat +2°C', carbonImpact: -1.5, costImpact: -18.0 },
    { category: 'Browser', actionName: 'Infinite Scroll Warning Triggered', carbonImpact: 0.4, costImpact: 4.8 },
    { category: 'Browser', actionName: '3h 4K YouTube Streaming', carbonImpact: 0.38, costImpact: 7.5 },
    { category: 'Hardware', actionName: 'Sleep Mode 6h', carbonImpact: -0.03, costImpact: -1.8 },
    { category: 'Lifestyle', actionName: '1 Meat-Free Day', carbonImpact: -3.3, costImpact: -150 }
  ];

  // Create 30 days of seeded logs with slight randomization
  const logs = [];
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * 24 * 3600 * 1000);
    // Pick 2-4 random actions per day
    const dayActions = actions.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
    for (const action of dayActions) {
      logs.push({ ...action, userId, timestamp, rawData: {} });
    }
  }

  await ActivityLog.insertMany(logs);
};

// Fallback chart data if no logs exist yet
const generateFallbackChartData = (period) => {
  const days = period === 'weekly' ? 7 : period === 'yearly' ? 12 : 30;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const base = 15 - i * (10 / days);
    const noise = Math.random() * 3 - 1.5;
    const co2 = Math.max(1, base + noise);
    return {
      date: date.toISOString().split('T')[0],
      co2: parseFloat(co2.toFixed(2)),
      cost: parseFloat((co2 * 12.5).toFixed(2)),
      saved: parseFloat((i * 0.5 + Math.random() * 2).toFixed(2))
    };
  });
};

module.exports = { getMetrics, getLeaderboard, seedDemo };
