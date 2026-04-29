/**
 * api.ts
 * Real API client for CarbonTwin backend.
 * Replaces mockApi.ts – all calls go to http://localhost:3001/api
 * Falls back gracefully to mock data if backend is unavailable.
 */

import { MOCK_USER, MOCK_CHART_DATA, MOCK_LEADERBOARD, MOCK_SUGGESTIONS, MOCK_ACTIVITY_LOG } from './mockData';

const BASE_URL = 'http://localhost:3001/api';

// Default demo user ID stored locally
const getDemoUserId = () => localStorage.getItem('carbontwin_userId') || '';

const setDemoUserId = (id: string) => localStorage.setItem('carbontwin_userId', id);

// Generic fetch wrapper with error handling and fallback
const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  fallback?: T
): Promise<T> => {
  try {
    const token = localStorage.getItem('carbontwin_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] ${path} failed:`, (err as Error).message, fallback ? '(using fallback)' : '');
    if (fallback !== undefined) return fallback;
    throw err;
  }
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      return apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    signup: async (name: string, email: string, password: string) => {
      return apiFetch<any>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
    }
  },
  dashboard: {
    /**
     * Fetch unified dashboard metrics (user, chart data, activity log)
     */
    getMetrics: async (period = 'monthly') => {
      // Try seeding first to ensure demo user exists
      const userId = getDemoUserId();
      
      const data = await apiFetch<any>(
        `/dashboard/metrics?userId=${userId}&period=${period}`,
        {},
        {
          user: MOCK_USER,
          chartData: MOCK_CHART_DATA,
          recentActivity: MOCK_ACTIVITY_LOG
        }
      );

      // Save userId from server for future requests
      if (data?.user?.id && !getDemoUserId()) {
        setDemoUserId(data.user.id);
      }

      return data;
    },

    /**
     * Fetch leaderboard (top 10 by EcoScore)
     */
    getLeaderboard: async () => {
      const data = await apiFetch<{ data: any[] }>(
        '/dashboard/leaderboard',
        {},
        { data: MOCK_LEADERBOARD }
      );
      return data.data || data;
    },

    /**
     * Seed demo data (called on first load)
     */
    seed: async () => {
      try {
        const data = await apiFetch<any>('/dashboard/seed', {});
        if (data?.userId) setDemoUserId(data.userId);
        return data;
      } catch {
        // Silent fail – seed is optional
      }
    }
  },

  suggestions: {
    /**
     * Get daily AI-generated suggestions
     */
    getDaily: async () => {
      const userId = getDemoUserId();
      const data = await apiFetch<any[]>(
        `/suggestions?userId=${userId}`,
        {},
        MOCK_SUGGESTIONS.map(s => ({ ...s, id: s.id, text: s.text }))
      );
      return Array.isArray(data) ? data : MOCK_SUGGESTIONS;
    },

    /**
     * Accept or dismiss a suggestion
     */
    actionSuggestion: async (id: string, action: 'accept' | 'dismiss') => {
      return apiFetch<any>(
        `/suggestions/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action })
        },
        { success: true, id, action }
      );
    },

    /**
     * Manually regenerate AI suggestions
     */
    generate: async () => {
      const userId = getDemoUserId();
      return apiFetch<any>(
        '/suggestions/generate',
        {
          method: 'POST',
          body: JSON.stringify({ userId })
        }
      );
    }
  },

  simulator: {
    /**
     * Run what-if simulation for a single or multiple habits
     */
    whatIf: async (habit: string, value: number) => {
      const data = await apiFetch<any>(
        '/simulator/what-if',
        {
          method: 'POST',
          body: JSON.stringify({ habit, value })
        },
        (() => {
          // Fallback calculation matches backend logic
          let savingsPercent = 0, carbonSavedKg = 0, rupeesSavedInr = 0;
          switch (habit) {
            case 'videoQuality':
              savingsPercent = value * 0.4; carbonSavedKg = value * 0.05; rupeesSavedInr = value * 0.8; break;
            case 'acTemp':
              savingsPercent = value * 0.6; carbonSavedKg = value * 0.12; rupeesSavedInr = value * 1.5; break;
            case 'zombieTabs':
              savingsPercent = value * 0.15; carbonSavedKg = value * 0.02; rupeesSavedInr = value * 0.3; break;
          }
          return { savingsPercent, carbonSavedKg, rupeesSavedInr };
        })()
      );
      return data;
    }
  },

  chat: {
    /**
     * Send a message to the Groq AI Eco-Coach
     */
    sendMessage: async (message: string, history: Array<{role: string, content: string}> = []) => {
      const userId = getDemoUserId();
      const data = await apiFetch<{ text: string; timestamp: string }>(
        '/chat',
        {
          method: 'POST',
          body: JSON.stringify({ message, userId, history })
        },
        {
          text: "My neural network is napping. But seriously—close 10 tabs right now. I'll be back.",
          timestamp: new Date().toISOString()
        }
      );
      return data;
    }
  },

  ingest: {
    /**
     * Send browser telemetry to the backend
     */
    browser: async (data: { tabCount?: number; videoHours?: number; videoQuality?: string; searchCount?: number }) => {
      const userId = getDemoUserId();
      return apiFetch<any>('/ingest/browser', {
        method: 'POST',
        body: JSON.stringify({ userId, ...data })
      });
    },

    hardware: async (data: { sleepHours?: number; brightnessReductionPercent?: number; smartChargingEnabled?: boolean }) => {
      const userId = getDemoUserId();
      return apiFetch<any>('/ingest/hardware', {
        method: 'POST',
        body: JSON.stringify({ userId, ...data })
      });
    },

    lifestyle: async (data: { acTempIncrease?: number; meatFreeDays?: number; publicTransportDays?: number }) => {
      const userId = getDemoUserId();
      return apiFetch<any>('/ingest/lifestyle', {
        method: 'POST',
        body: JSON.stringify({ userId, ...data })
      });
    }
  }
};
