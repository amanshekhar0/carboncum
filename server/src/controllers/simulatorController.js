/**
 * simulatorController.js
 * 
 * POST /api/simulator/what-if
 * Stateless, high-speed simulation. No DB writes.
 * Results are cached in Redis/memory for identical inputs.
 */

const { simulateHabitChange } = require('../services/CarbonEngine');
const { get, set } = require('../services/RedisService');
const { CACHE } = require('../config/constants');

/**
 * POST /api/simulator/what-if
 * Body: { habits: [{ habit: string, value: number }] }
 * OR simple: { habit: string, value: number }
 */
const whatIf = async (req, res) => {
  try {
    const { habit, value, habits } = req.body;

    // Support both single habit and multi-habit batch
    const habitList = habits || [{ habit, value }];

    if (!habitList || habitList.length === 0) {
      return res.status(400).json({ error: 'Provide habit and value' });
    }

    // Create cache key from sorted input
    const cacheKey = `sim:${JSON.stringify(habitList.sort((a, b) => a.habit.localeCompare(b.habit)))}`;
    const cached = await get(cacheKey);
    if (cached) {
      return res.json({ ...JSON.parse(cached), fromCache: true });
    }

    // Aggregate results across all habits
    let totalSavingsPercent = 0;
    let totalCarbonSavedKg = 0;
    let totalRupeesSavedInr = 0;
    const breakdown = {};

    for (const { habit: h, value: v } of habitList) {
      const result = simulateHabitChange(h, Number(v));
      totalSavingsPercent += result.savingsPercent;
      totalCarbonSavedKg += result.carbonSavedKg;
      totalRupeesSavedInr += result.rupeesSavedInr;
      breakdown[h] = result;
    }

    const response = {
      savingsPercent: parseFloat(Math.min(totalSavingsPercent, 100).toFixed(1)),
      carbonSavedKg: parseFloat(totalCarbonSavedKg.toFixed(3)),
      rupeesSavedInr: parseFloat(totalRupeesSavedInr.toFixed(2)),
      // Annualized projections
      annualCarbonSavedKg: parseFloat((totalCarbonSavedKg * 365).toFixed(1)),
      annualRupeesSavedInr: parseFloat((totalRupeesSavedInr * 365).toFixed(0)),
      breakdown
    };

    // Cache for TTL duration
    await set(cacheKey, JSON.stringify(response), CACHE.SIMULATOR_TTL);

    res.json({ ...response, fromCache: false });
  } catch (err) {
    console.error('[simulatorController]', err.message);
    res.status(500).json({ error: 'Simulation failed' });
  }
};

module.exports = { whatIf };
