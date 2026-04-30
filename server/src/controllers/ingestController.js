/**
 * ingestController.js
 *
 * POST /api/ingest/browser   – Chrome extension telemetry
 * POST /api/ingest/hardware  – hardware/sleep events
 * POST /api/ingest/lifestyle – manual lifestyle log
 *
 * Each route:
 *  1. Computes carbon/cost via CarbonEngine
 *  2. Persists an ActivityLog row
 *  3. Updates the user's running totals + Eco-Score
 *  4. Emits a real-time socket update to the connected dashboard
 */

const mongoose = require('mongoose');

const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const {
  calculateBrowserImpact,
  calculateHardwareImpact,
  calculateLifestyleImpact
} = require('../services/CarbonEngine');
const { sendSlackCongrats } = require('../services/AIService');
const { del } = require('../services/RedisService');
const { emitUpdate } = require('../services/SocketService');

const ensureDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database is currently unavailable. Please retry shortly.' });
    return false;
  }
  return true;
};

const updateUserTotals = async (userId, carbonImpact, costImpact) => {
  const user = await User.findById(userId);
  if (!user) return null;

  if (carbonImpact < 0) {
    user.totalCarbonSaved = Number((user.totalCarbonSaved + Math.abs(carbonImpact)).toFixed(3));
    user.totalRupeesSaved = Number((user.totalRupeesSaved + Math.abs(costImpact)).toFixed(2));
    // Reward modest eco-points for net positive actions
    user.ecoPoints = (user.ecoPoints || 0) + Math.max(1, Math.round(Math.abs(carbonImpact) * 10));
  }

  const today = new Date().toDateString();
  const last = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (last !== today) {
    user.currentStreak = last === yesterday ? (user.currentStreak || 0) + 1 : 1;
    user.lastActiveDate = new Date();
  }

  user.recalculateEcoScore();
  await user.save();

  await del('leaderboard:global');
  await del('stats:global');

  emitUpdate(userId.toString(), {
    id: user._id,
    name: user.name,
    ecoScore: user.ecoScore,
    currentStreak: user.currentStreak,
    totalCarbonSaved: user.totalCarbonSaved,
    totalRupeesSaved: user.totalRupeesSaved,
    ecoPoints: user.ecoPoints
  });

  if (user.ecoScore >= 90) {
    sendSlackCongrats(user.name, user.ecoScore).catch(() => {});
  }

  return user;
};

const ingestBrowser = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const impact = calculateBrowserImpact(req.body || {});

    const log = await ActivityLog.create({
      userId: req.userId,
      category: 'Browser',
      actionName: buildBrowserActionName(req.body || {}),
      carbonImpact: impact.carbonImpact,
      costImpact: impact.costImpact,
      rawData: req.body
    });

    const user = await updateUserTotals(req.userId, impact.carbonImpact, impact.costImpact);
    res.json({ success: true, logId: log._id, impact, updatedEcoScore: user?.ecoScore || 0 });
  } catch (err) {
    console.error('[ingestController] ingestBrowser error:', err.message);
    res.status(500).json({ error: 'Failed to ingest browser activity' });
  }
};

const ingestHardware = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const impact = calculateHardwareImpact(req.body || {});

    const log = await ActivityLog.create({
      userId: req.userId,
      category: 'Hardware',
      actionName: buildHardwareActionName(req.body || {}),
      carbonImpact: impact.carbonImpact,
      costImpact: impact.costImpact,
      rawData: req.body
    });

    const user = await updateUserTotals(req.userId, impact.carbonImpact, impact.costImpact);
    res.json({ success: true, logId: log._id, impact, updatedEcoScore: user?.ecoScore || 0 });
  } catch (err) {
    console.error('[ingestController] ingestHardware error:', err.message);
    res.status(500).json({ error: 'Failed to ingest hardware activity' });
  }
};

const ingestLifestyle = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const impact = calculateLifestyleImpact(req.body || {});

    const log = await ActivityLog.create({
      userId: req.userId,
      category: 'Lifestyle',
      actionName: buildLifestyleActionName(req.body || {}),
      carbonImpact: impact.carbonImpact,
      costImpact: impact.costImpact,
      rawData: req.body
    });

    const user = await updateUserTotals(req.userId, impact.carbonImpact, impact.costImpact);
    res.json({ success: true, logId: log._id, impact, updatedEcoScore: user?.ecoScore || 0 });
  } catch (err) {
    console.error('[ingestController] ingestLifestyle error:', err.message);
    res.status(500).json({ error: 'Failed to ingest lifestyle activity' });
  }
};

const buildBrowserActionName = (data) => {
  const parts = [];
  if (data.tabCount > 0) parts.push(`${data.tabCount} inactive tabs`);
  if (data.videoHours > 0) parts.push(`${data.videoHours}h ${data.videoQuality || '1080p'} streaming`);
  if (data.searchCount > 0) parts.push(`${data.searchCount} web searches`);
  if (data.aiTokens > 0) parts.push(`${data.aiTokens} AI tokens`);
  if (data.isDarkMode) parts.push('Dark mode active');
  if (data.directNavigationCount > 0) parts.push(`${data.directNavigationCount} direct navigations`);
  return parts.length > 0 ? parts.join(', ') : 'Browser activity';
};

const buildHardwareActionName = (data) => {
  const parts = [];
  if (data.sleepHours > 0) parts.push(`Sleep mode ${data.sleepHours}h`);
  if (data.brightnessReductionPercent > 0) parts.push(`Brightness -${data.brightnessReductionPercent}%`);
  if (data.smartChargingEnabled) parts.push('Smart charging on');
  if (data.unpluggedHours > 0) parts.push(`Unplugged ${data.unpluggedHours}h`);
  if (data.peripheralsDisconnected > 0) parts.push(`${data.peripheralsDisconnected} peripherals off`);
  return parts.length > 0 ? parts.join(', ') : 'Hardware activity';
};

const buildLifestyleActionName = (data) => {
  const parts = [];
  if (data.acTempIncrease > 0) parts.push(`AC +${data.acTempIncrease}°C`);
  if (data.meatFreeDays > 0) parts.push(`${data.meatFreeDays} meat-free day(s)`);
  if (data.publicTransportDays > 0) parts.push(`${data.publicTransportDays} public-transport day(s)`);
  if (data.paperlessPages > 0) parts.push(`${data.paperlessPages} paperless pages`);
  if (data.deviceFreeHours > 0) parts.push(`${data.deviceFreeHours} device-free hours`);
  return parts.length > 0 ? parts.join(', ') : 'Lifestyle activity';
};

module.exports = { ingestBrowser, ingestHardware, ingestLifestyle };
