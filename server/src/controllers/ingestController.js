/**
 * ingestController.js
 * Handles all incoming telemetry from clients:
 *   POST /api/ingest/browser   - Chrome Extension data
 *   POST /api/ingest/hardware  - Smart device events
 *   POST /api/ingest/lifestyle - Manual user inputs
 * 
 * Architecture: Each route calculates impact via CarbonEngine,
 * writes to ActivityLog, then updates the User's running totals.
 */

const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { calculateBrowserImpact, calculateHardwareImpact, calculateLifestyleImpact } = require('../services/CarbonEngine');
const { sendSlackCongrats } = require('../services/AIService');
const { del } = require('../services/RedisService');

// Default demo user ID (in production this comes from JWT auth middleware)
const DEMO_USER_ID = process.env.DEMO_USER_ID;

const updateUserTotals = async (userId, carbonImpact, costImpact) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('[ingestController] Skipping DB update – not connected');
      return { ecoScore: 50, name: 'Guest' }; // Return a dummy user object
    }

    let user = await User.findById(userId);
    if (!user) {
      user = await User.create({
        _id: userId,
        name: 'Aarav Sharma',
        email: 'aarav@startup.io',
        ecoScore: 50,
        currentStreak: 0,
        totalCarbonSaved: 0,
        totalRupeesSaved: 0
      });
    }

    // Only count savings (negative impact means saved)
    if (carbonImpact < 0) {
      user.totalCarbonSaved += Math.abs(carbonImpact);
      user.totalRupeesSaved += Math.abs(costImpact);
    }

    // Update streak: if last active was yesterday, increment streak
    const today = new Date().toDateString();
    const lastActive = new Date(user.lastActiveDate).toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastActive !== today) {
      if (lastActive === yesterday) {
        user.currentStreak += 1;
      } else if (lastActive !== today) {
        user.currentStreak = 1; // Reset streak
      }
      user.lastActiveDate = new Date();
    }

    // Recalculate eco-score
    user.recalculateEcoScore();
    await user.save();

    // Invalidate cached leaderboard when user stats change
    await del(`leaderboard:${user.organizationId || 'default'}`);
    await del('leaderboard:default');

    // Notify Slack if user just crossed 90
    if (user.ecoScore >= 90) {
      sendSlackCongrats(user.name, user.ecoScore).catch(console.error);
    }

    return user;
  } catch (err) {
    console.error('[ingestController] updateUserTotals error:', err.message);
  }
};

/**
 * POST /api/ingest/browser
 * Body: { userId?, tabCount, videoHours, videoQuality, searchCount, emailMb }
 */
const ingestBrowser = async (req, res) => {
  try {
    const { userId, tabCount = 0, videoHours = 0, videoQuality = '1080p', searchCount = 0, emailMb = 0 } = req.body;
    const uid = userId || DEMO_USER_ID;

    const impact = calculateBrowserImpact({ tabCount, videoHours, videoQuality, searchCount, emailMb });

    const mongoose = require('mongoose');
    let log = { _id: 'mock_log' };
    if (mongoose.connection.readyState === 1) {
      log = await ActivityLog.create({
        userId: uid,
        category: 'Browser',
        actionName: buildBrowserActionName(req.body),
        carbonImpact: impact.carbonImpact,
        costImpact: impact.costImpact,
        rawData: req.body
      });
    }

    const user = await updateUserTotals(uid, impact.carbonImpact, impact.costImpact);

    res.json({
      success: true,
      logId: log._id,
      impact,
      updatedEcoScore: user?.ecoScore
    });
  } catch (err) {
    console.error('[ingestBrowser]', err.message);
    res.status(500).json({ error: 'Failed to ingest browser activity' });
  }
};

/**
 * POST /api/ingest/hardware
 * Body: { userId?, sleepHours, brightnessReductionPercent, smartChargingEnabled }
 */
const ingestHardware = async (req, res) => {
  try {
    const { userId, sleepHours = 0, brightnessReductionPercent = 0, smartChargingEnabled = false } = req.body;
    const uid = userId || DEMO_USER_ID;

    const impact = calculateHardwareImpact({ sleepHours, brightnessReductionPercent, smartChargingEnabled });

    const mongoose = require('mongoose');
    let log = { _id: 'mock_log' };
    if (mongoose.connection.readyState === 1) {
      log = await ActivityLog.create({
        userId: uid,
        category: 'Hardware',
        actionName: buildHardwareActionName(req.body),
        carbonImpact: impact.carbonImpact,
        costImpact: impact.costImpact,
        rawData: req.body
      });
    }

    const user = await updateUserTotals(uid, impact.carbonImpact, impact.costImpact);

    res.json({ success: true, logId: log._id, impact, updatedEcoScore: user?.ecoScore });
  } catch (err) {
    console.error('[ingestHardware]', err.message);
    res.status(500).json({ error: 'Failed to ingest hardware activity' });
  }
};

/**
 * POST /api/ingest/lifestyle
 * Body: { userId?, acTempIncrease, meatFreeDays, publicTransportDays }
 */
const ingestLifestyle = async (req, res) => {
  try {
    const { userId, acTempIncrease = 0, meatFreeDays = 0, publicTransportDays = 0 } = req.body;
    const uid = userId || DEMO_USER_ID;

    const impact = calculateLifestyleImpact({ acTempIncrease, meatFreeDays, publicTransportDays });

    const mongoose = require('mongoose');
    let log = { _id: 'mock_log' };
    if (mongoose.connection.readyState === 1) {
      log = await ActivityLog.create({
        userId: uid,
        category: 'Lifestyle',
        actionName: buildLifestyleActionName(req.body),
        carbonImpact: impact.carbonImpact,
        costImpact: impact.costImpact,
        rawData: req.body
      });
    }

    const user = await updateUserTotals(uid, impact.carbonImpact, impact.costImpact);

    res.json({ success: true, logId: log._id, impact, updatedEcoScore: user?.ecoScore });
  } catch (err) {
    console.error('[ingestLifestyle]', err.message);
    res.status(500).json({ error: 'Failed to ingest lifestyle activity' });
  }
};

// ----- Action name builders -----
const buildBrowserActionName = (data) => {
  const parts = [];
  if (data.tabCount > 0) parts.push(`${data.tabCount} Zombie Tabs`);
  if (data.videoHours > 0) parts.push(`${data.videoHours}h ${data.videoQuality || '1080p'} Streaming`);
  if (data.searchCount > 0) parts.push(`${data.searchCount} Web Searches`);
  if (data.aiTokens > 0) parts.push(`${data.aiTokens} AI Tokens`);
  if (data.isDarkMode) parts.push('Dark Mode Active');
  if (data.directNavigationCount > 0) parts.push(`${data.directNavigationCount} Direct Navigations`);
  return parts.length > 0 ? parts.join(', ') : 'Browser Activity';
};

const buildHardwareActionName = (data) => {
  const parts = [];
  if (data.sleepHours > 0) parts.push(`Sleep Mode ${data.sleepHours}h`);
  if (data.brightnessReductionPercent > 0) parts.push(`Brightness -${data.brightnessReductionPercent}%`);
  if (data.smartChargingEnabled) parts.push('Smart Charging');
  if (data.unpluggedHours > 0) parts.push(`Unplugged ${data.unpluggedHours}h`);
  if (data.peripheralsDisconnected > 0) parts.push(`${data.peripheralsDisconnected} Peripherals Off`);
  return parts.length > 0 ? parts.join(', ') : 'Hardware Activity';
};

const buildLifestyleActionName = (data) => {
  const parts = [];
  if (data.acTempIncrease > 0) parts.push(`AC +${data.acTempIncrease}°C`);
  if (data.meatFreeDays > 0) parts.push(`${data.meatFreeDays} Meat-Free Day(s)`);
  if (data.publicTransportDays > 0) parts.push(`${data.publicTransportDays} Public Transport Day(s)`);
  if (data.paperlessPages > 0) parts.push(`${data.paperlessPages} Paperless Pages`);
  if (data.deviceFreeHours > 0) parts.push(`${data.deviceFreeHours} Device-Free Hours`);
  return parts.length > 0 ? parts.join(', ') : 'Lifestyle Activity';
};

module.exports = { ingestBrowser, ingestHardware, ingestLifestyle };
