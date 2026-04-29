/**
 * nudgeCron.js
 * Daily 8 AM cron job that:
 * 1. Fetches all active users
 * 2. Reads their last 7 days of activity logs
 * 3. Generates 3 personalized suggestions via Groq
 * 4. Saves them to the Suggestion collection
 */

const cron = require('node-cron');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Suggestion = require('../models/Suggestion');
const { generateDailySuggestions } = require('../services/AIService');

const runNudgeJob = async () => {
  console.log('[NudgeCron] Starting daily suggestion generation...');
  
  try {
    // Find users active in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const activeUsers = await User.find({
      lastActiveDate: { $gte: sevenDaysAgo }
    }).lean();

    console.log(`[NudgeCron] Processing ${activeUsers.length} active users`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of activeUsers) {
      try {
        // Get activity logs for this user
        const activityLogs = await ActivityLog.find({
          userId: user._id,
          timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: -1 }).limit(20).lean();

        if (activityLogs.length === 0) {
          console.log(`[NudgeCron] No activity for user ${user.name}, skipping`);
          continue;
        }

        // Generate AI suggestions
        const suggestions = await generateDailySuggestions(user, activityLogs);

        // Clear old pending suggestions (keep history but don't pile up)
        await Suggestion.updateMany(
          { userId: user._id, status: 'pending' },
          { status: 'ignored', actionedAt: new Date() }
        );

        // Save new suggestions
        await Suggestion.insertMany(
          suggestions.map((s) => ({
            userId: user._id,
            suggestionText: s.suggestionText,
            potentialSavingsKg: s.potentialSavingsKg || 0,
            potentialSavingsInr: s.potentialSavingsInr || 0,
            category: s.category || 'Browser',
            status: 'pending'
          }))
        );

        // Update streak
        await User.findByIdAndUpdate(user._id, {
          lastActiveDate: new Date()
        });

        successCount++;
        console.log(`[NudgeCron] ✓ Generated suggestions for ${user.name}`);

        // Rate limit: wait 500ms between users to avoid Groq rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (userErr) {
        errorCount++;
        console.error(`[NudgeCron] Failed for user ${user.name}:`, userErr.message);
      }
    }

    console.log(`[NudgeCron] Complete. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (err) {
    console.error('[NudgeCron] Fatal error:', err.message);
  }
};

/**
 * Starts the daily cron job.
 * Schedule: Every day at 8:00 AM IST (2:30 UTC)
 */
const startNudgeCron = () => {
  // Run at 8 AM IST = 2:30 AM UTC
  cron.schedule('30 2 * * *', runNudgeJob, {
    timezone: 'Asia/Kolkata'
  });
  
  console.log('[NudgeCron] Daily nudge scheduled for 8:00 AM IST');
};

// Export both for programmatic invocation
module.exports = { startNudgeCron, runNudgeJob };
