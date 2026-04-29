import {
  MOCK_USER,
  MOCK_CHART_DATA,
  MOCK_LEADERBOARD,
  MOCK_SUGGESTIONS,
  MOCK_ACTIVITY_LOG } from
'./mockData';
import { calculateActivityImpact } from './carbonEngine';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  dashboard: {
    getMetrics: async () => {
      await delay(600);
      return {
        user: MOCK_USER,
        chartData: MOCK_CHART_DATA,
        recentActivity: MOCK_ACTIVITY_LOG
      };
    },
    getLeaderboard: async () => {
      await delay(400);
      return MOCK_LEADERBOARD;
    }
  },

  suggestions: {
    getDaily: async () => {
      await delay(800);
      return MOCK_SUGGESTIONS;
    },
    actionSuggestion: async (id: string, action: 'accept' | 'dismiss') => {
      await delay(300);
      return { success: true, id, action };
    }
  },

  simulator: {
    whatIf: async (habit: string, value: number) => {
      // Stateless, high-speed simulation
      await delay(100); // Fast response for sliders

      let savingsPercent = 0;
      let carbonSaved = 0;
      let rupeesSaved = 0;

      switch (habit) {
        case 'videoQuality':
          // 0 = 4K, 100 = 480p
          savingsPercent = value * 0.4;
          carbonSaved = value * 0.05;
          rupeesSaved = value * 0.8;
          break;
        case 'acTemp':
          // 0 = 18C, 100 = 26C
          savingsPercent = value * 0.6;
          carbonSaved = value * 0.12;
          rupeesSaved = value * 1.5;
          break;
        case 'zombieTabs':
          // 0 = 100 tabs, 100 = 0 tabs
          savingsPercent = value * 0.15;
          carbonSaved = value * 0.02;
          rupeesSaved = value * 0.3;
          break;
      }

      return {
        savingsPercent,
        carbonSavedKg: carbonSaved,
        rupeesSavedInr: rupeesSaved
      };
    }
  },

  chat: {
    sendMessage: async (message: string) => {
      await delay(1200);

      const lowerMsg = message.toLowerCase();
      let reply = '';

      if (lowerMsg.includes('score') && lowerMsg.includes('drop')) {
        reply =
        "Listen up! Your Eco-Score dropped because you left 45 tabs open overnight while streaming a 4K fireplace video. That's literally burning coal to watch fake fire. Close those tabs and we'll talk.";
      } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
        reply =
        "I'm your AI Eco-Coach. I don't do small talk. I do carbon reduction. Your current streak is 12 days—don't mess it up today. What do you need?";
      } else if (lowerMsg.includes('help')) {
        reply =
        "Check your Action Center. I've queued up 3 suggestions that will save you ₹297 and 4.4kg of CO2 today. Execute them.";
      } else {
        reply =
        'Every MB you download has a carbon cost. Stop doomscrolling and start optimizing. Your current footprint is 14% higher than your peers this week.';
      }

      return { text: reply, timestamp: new Date().toISOString() };
    }
  }
};