/**
 * AIService.js
 * Wrapper around the Groq API (Llama-3.3-70b model).
 * Used by the chatbot endpoint and the daily nudge cron job.
 */

const Groq = require('groq-sdk');

// Initialize Groq client with API key from environment
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// The primary model to use – fast and powerful
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Generates a chat completion from Groq.
 * @param {Array} messages - Array of { role, content } objects
 * @param {object} options - Optional overrides (temperature, max_tokens)
 * @returns {string} The assistant's reply text
 */
const chat = async (messages, options = {}) => {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.max_tokens ?? 512,
    stream: false
  });
  return completion.choices[0]?.message?.content || '';
};

/**
 * Generates 3 personalized daily eco-suggestions for a user
 * based on their last 7 days of activity logs.
 * @param {object} user - User doc (name, ecoScore, currentStreak)
 * @param {Array} activityLogs - Recent ActivityLog documents
 * @returns {Array} Array of suggestion objects
 */
const generateDailySuggestions = async (user, activityLogs) => {
  const activitySummary = activityLogs.map(log =>
    `- [${log.category}] ${log.actionName}: ${log.carbonImpact > 0 ? '+' : ''}${log.carbonImpact.toFixed(3)} kg CO2, ₹${log.costImpact.toFixed(2)}`
  ).join('\n');

  const systemPrompt = `You are CarbonTwin's Aggressive Eco-Coach AI. You analyze corporate digital carbon footprints.
Your personality: Direct, data-driven, slightly sarcastic, but genuinely helpful.
You speak in startup lingo. You care deeply about climate but don't moralize excessively.
Always convert CO2 to financial impact in Indian Rupees (₹).`;

  const userPrompt = `User: ${user.name}
Current Eco-Score: ${user.ecoScore}/100
Current Streak: ${user.currentStreak} days

Their activity over the past 7 days:
${activitySummary}

Generate exactly 3 highly specific, actionable suggestions.
Prioritize these 20 habits:
1. Tab Management (Zombie Tabs)
2. Email Decluttering (Delete 1k+ unread)
3. Video Optimization (4K to 720p/480p)
4. AI Prompt Efficiency (One-shot prompts)
5. Cloud Cleanup (Dark Data)
6. Search Engine Mindfulness (Direct URL vs Search)
7. Dark Mode Activation
8. Extension Audit (Disable high-resource ones)
9. Smart Sleep Mode (vs Idle)
10. Unplugging Strategy (Vampire power)
11. Brightness Control (Lower 20-30%)
12. Peripheral Management (Disconnect unused)
13. Public Transport (Metro vs Car)
14. AC Thermostat (+1°C savings)
15. Meat-Free Rewards
16. Device-Free Hours
17. E-waste Extension (Delay upgrades)
18. Green Electricity Switch
19. Smart Lighting
20. Paperless Transition

Format your response as valid JSON array only (no markdown, no explanation):
[
  {
    "suggestionText": "specific action they should take",
    "potentialSavingsKg": <number>,
    "potentialSavingsInr": <number>,
    "category": "<Browser|Hardware|Lifestyle>"
  }
]`;

  try {
    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.7, max_tokens: 600 });

    // Parse JSON from Groq response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse suggestions JSON from AI response');
  } catch (err) {
    console.error('[AIService] generateDailySuggestions error:', err.message);
    // Fallback suggestions if AI fails
    return [
      {
        suggestionText: 'Close inactive browser tabs to reduce RAM and energy consumption.',
        potentialSavingsKg: 0.5,
        potentialSavingsInr: 8.0,
        category: 'Browser'
      },
      {
        suggestionText: 'Reduce video streaming quality from 4K to 1080p for background content.',
        potentialSavingsKg: 2.1,
        potentialSavingsInr: 28.5,
        category: 'Lifestyle'
      },
      {
        suggestionText: 'Enable smart sleep mode on your laptop after 5 minutes of inactivity.',
        potentialSavingsKg: 0.8,
        potentialSavingsInr: 12.0,
        category: 'Hardware'
      }
    ];
  }
};

/**
 * Chat with the AI Eco-Coach using real user context
 * @param {string} userMessage - The user's query
 * @param {object} dashboardStats - The user's current metrics
 * @param {Array} history - Previous conversation messages
 * @returns {string} AI response text
 */
const ecoCoachChat = async (userMessage, dashboardStats, history = []) => {
  const systemPrompt = `You are CarbonTwin's Eco-Coach — an aggressive but helpful startup sustainability advisor.

Your personality traits:
- Direct and data-driven. No fluff.
- Slightly sarcastic when users make bad eco choices, but always constructive.
- You convert everything to ₹ (Indian Rupees) to make abstract CO2 feel financially real.
- You use startup/tech language.
- Max 3 sentences per response. Be concise.

Current user dashboard stats:
- Eco-Score: ${dashboardStats.ecoScore}/100
- Total Carbon Saved: ${dashboardStats.totalCarbonSaved} kg
- Total Rupees Saved: ₹${dashboardStats.totalRupeesSaved}
- Current Streak: ${dashboardStats.currentStreak} days

Answer the user's question using these stats where relevant. If they ask why their score dropped, analyze their recent behavior. Always end with one actionable next step.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6), // Keep last 3 exchanges for context
    { role: 'user', content: userMessage }
  ];

  return await chat(messages, { temperature: 0.85, max_tokens: 256 });
};

/**
 * Posts a congratulatory Slack message when a user hits Eco-Score 90+
 * Uses the SLACK_WEBHOOK_URL environment variable
 * @param {string} userName
 * @param {number} ecoScore
 */
const sendSlackCongrats = async (userName, ecoScore) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(`[Slack] Would notify: ${userName} hit Eco-Score ${ecoScore}! (No webhook configured)`);
    return;
  }

  try {
    const axios = require('axios');
    await axios.post(webhookUrl, {
      text: `🌱 *${userName}* just hit an Eco-Score of *${ecoScore}/100* on CarbonTwin! 🎉\nThey're saving the planet AND saving ₹. Who's next?`
    });
    console.log(`[Slack] Congrats notification sent for ${userName}`);
  } catch (err) {
    console.error('[Slack] Failed to send notification:', err.message);
  }
};

/**
 * Generates initial synthetic activity data for a new user using Groq.
 * This ensures the user doesn't start with "dummy" data but a personalized history.
 */
const seedUserActivity = async (userId) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const User = require('../models/User');

    const prompt = `Generate a realistic 7-day carbon footprint history for a professional user.
    Categories: Browser, Hardware, Lifestyle.
    Return a JSON array of objects with: { category, actionName, carbonImpact (negative is saving, positive is emission), costImpact (in INR), date (ISO string for the last 7 days) }.
    Make it feel personalized and diverse (e.g., streaming 4K, meat-free lunch, closing tabs).
    Return ONLY the JSON. Example format:
    { "activities": [ { "category": "Browser", "actionName": "...", "carbonImpact": -0.2, "costImpact": -5.0, "date": "..." } ] }`;

    const response = await chat([
      { role: 'system', content: 'You are a sustainability data generator. Output ONLY JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7, max_tokens: 1500 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned non-JSON response');
    
    const content = JSON.parse(jsonMatch[0]);
    const logs = content.activities || content;

    if (!Array.isArray(logs)) throw new Error('AI returned invalid format');

    const mappedLogs = logs.slice(0, 15).map(l => ({
      userId,
      category: l.category || 'Browser',
      actionName: l.actionName || 'Active Monitoring',
      carbonImpact: l.carbonImpact || 0,
      costImpact: l.costImpact || 0,
      timestamp: new Date(l.date || Date.now()),
      rawData: { aiGenerated: true }
    }));

    await ActivityLog.insertMany(mappedLogs);

    // Update user totals
    const totalCarbon = mappedLogs.reduce((acc, l) => acc + (l.carbonImpact < 0 ? Math.abs(l.carbonImpact) : 0), 0);
    const totalCost = mappedLogs.reduce((acc, l) => acc + (l.costImpact < 0 ? Math.abs(l.costImpact) : 0), 0);

    await User.findByIdAndUpdate(userId, {
      totalCarbonSaved: totalCarbon,
      totalRupeesSaved: totalCost,
      currentStreak: 7,
      ecoScore: Math.min(100, Math.round((totalCarbon / 10) * 100) + 40)
    });

    console.log(`[AIService] Seeded ${mappedLogs.length} activities for user ${userId}`);
    return true;
  } catch (err) {
    console.error('[AIService] seedUserActivity failed:', err.message);
    return false;
  }
};

module.exports = { generateDailySuggestions, ecoCoachChat, sendSlackCongrats, seedUserActivity };
