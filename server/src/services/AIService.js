/**
 * AIService.js
 *
 * Thin wrapper around the Groq Llama API used by:
 *   - the chatbot endpoint (`ecoCoachChat`)
 *   - the daily nudge cron job (`generateDailySuggestions`)
 *
 * No fake-data injection. If the GROQ_API_KEY is missing the helpers throw a
 * clear error so the caller can render an honest "AI not configured" state.
 */

const GROQ_MODEL = 'llama-3.3-70b-versatile';

let groqClient = null;
const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on this server');
  }
  if (!groqClient) {
    const Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const chat = async (messages, options = {}) => {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.max_tokens ?? 512,
    stream: false
  });
  return completion.choices?.[0]?.message?.content || '';
};

/**
 * Generates 3 personalized daily eco suggestions for a user, using their
 * recent activity logs as concrete context.
 */
const generateDailySuggestions = async (user, activityLogs) => {
  const summary = (activityLogs || [])
    .map(
      (log) =>
        `- [${log.category}] ${log.actionName}: ${
          log.carbonImpact > 0 ? '+' : ''
        }${Number(log.carbonImpact).toFixed(3)} kg CO2, ₹${Number(log.costImpact).toFixed(2)}`
    )
    .join('\n');

  const systemPrompt = `You are CarbonTwin's Eco-Coach AI. You help users reduce their digital and lifestyle carbon footprint.
Tone: direct, concrete, practical. No moralizing. Always tie carbon to ₹ savings (Indian Rupees).
Never invent activity that the user did not actually log.`;

  const userPrompt = `User: ${user.name || 'User'}
Eco-Score: ${user.ecoScore ?? 0}/100
Streak: ${user.currentStreak ?? 0} days

Recent activity (last 7 days):
${summary || '(no activity logged yet)'}

Return EXACTLY 3 specific, actionable suggestions as raw JSON. Each suggestion must be tailored to this user's actual behavior (or, if no activity is logged, suggest gentle starter habits).
Format strictly:
[
  {"suggestionText":"<one concrete action>","potentialSavingsKg":<number>,"potentialSavingsInr":<number>,"category":"<Browser|Hardware|Lifestyle>"}
]`;

  const response = await chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.6, max_tokens: 600 }
  );

  const match = response.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error('AI response did not contain a JSON array of suggestions');
  }
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) {
    throw new Error('AI response was not an array');
  }
  return parsed.slice(0, 3);
};

/**
 * Streams a single Eco-Coach response with full user context.
 */
const ecoCoachChat = async (userMessage, dashboardStats, history = []) => {
  const recent = (dashboardStats.recentActions || [])
    .map((a) => `- ${a.category}: ${a.action} (${a.carbonImpact} kg)`)
    .join('\n');

  const systemPrompt = `You are CarbonTwin's Eco-Coach. Tone: direct, practical, supportive. Always frame carbon in ₹ for Indian users. Max 3 sentences.

User context:
- Name: ${dashboardStats.name || 'the user'}
- Eco-Score: ${dashboardStats.ecoScore}/100
- Total CO2 saved: ${dashboardStats.totalCarbonSaved} kg
- Total ₹ saved: ${dashboardStats.totalRupeesSaved}
- Current streak: ${dashboardStats.currentStreak} days
- Recent actions:
${recent || '(no recent actions)'}

Use this real data when answering. Never invent numbers. End with one concrete next step.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: String(h.content || '')
    })),
    { role: 'user', content: userMessage }
  ];

  return chat(messages, { temperature: 0.75, max_tokens: 256 });
};

const sendSlackCongrats = async (userName, ecoScore) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const axios = require('axios');
    await axios.post(webhookUrl, {
      text: `🌱 *${userName}* just hit an Eco-Score of *${ecoScore}/100* on CarbonTwin.`
    });
  } catch (err) {
    console.warn('[AIService] Slack notification failed:', err.message);
  }
};

module.exports = { generateDailySuggestions, ecoCoachChat, sendSlackCongrats };
