/**
 * api.ts
 * Real API client for the CarbonTwin backend.
 *
 * Single source of truth for HTTP calls.
 * No silent mock fallbacks – errors propagate so the UI can show truthful empty/error states.
 */

const RAW_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:3001/api';

const BASE_URL = (() => {
  const trimmed = RAW_BASE_URL.replace(/\/+$/, '');
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
})();

const STORAGE_TOKEN = 'carbontwin_token';
const STORAGE_USER_ID = 'carbontwin_userId';
const STORAGE_USER_NAME = 'carbontwin_userName';
const STORAGE_USER_EMAIL = 'carbontwin_userEmail';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const buildHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  const token = localStorage.getItem(STORAGE_TOKEN);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers as Record<string, string>)
  });

  if (res.status === 401 && !path.startsWith('/auth/')) {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER_ID);
    localStorage.removeItem(STORAGE_USER_NAME);
    localStorage.removeItem(STORAGE_USER_EMAIL);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    throw new ApiError('Session expired', 401);
  }

  const text = await res.text();
  let body: any = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!res.ok) {
    const message = (body && body.error) || res.statusText || `HTTP ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return body as T;
};

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    ecoScore: number;
  };
}

export interface UserMetrics {
  id: string;
  name: string;
  email: string;
  ecoScore: number;
  currentStreak: number;
  totalCarbonSaved: number;
  totalRupeesSaved: number;
  ecoPoints: number;
  avatarUrl: string;
  createdAt?: string;
}

export interface ChartPoint {
  date: string;
  co2: number;
  cost: number;
  saved: number;
}

export interface ActivityEntry {
  _id: string;
  category: 'Browser' | 'Hardware' | 'Lifestyle';
  actionName: string;
  carbonImpact: number;
  costImpact: number;
  timestamp: string;
}

export interface DashboardMetrics {
  user: UserMetrics;
  chartData: ChartPoint[];
  recentActivity: ActivityEntry[];
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  score: number;
  streak: number;
  carbonSaved: number;
  avatar: string;
  isCurrentUser?: boolean;
}

export interface Suggestion {
  id: string;
  text: string;
  potentialSavingsKg: number;
  potentialSavingsInr: number;
  category: 'Browser' | 'Hardware' | 'Lifestyle';
  status: 'pending' | 'completed' | 'ignored';
  createdAt: string;
}

export interface GlobalStats {
  totalUsers: number;
  totalCarbonSavedKg: number;
  totalRupeesSaved: number;
  totalActivities: number;
  averageEcoScore: number;
}

export const persistAuth = (res: AuthResponse) => {
  localStorage.setItem(STORAGE_TOKEN, res.token);
  localStorage.setItem(STORAGE_USER_ID, res.user.id);
  localStorage.setItem(STORAGE_USER_NAME, res.user.name);
  localStorage.setItem(STORAGE_USER_EMAIL, res.user.email);
};

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER_ID);
  localStorage.removeItem(STORAGE_USER_NAME);
  localStorage.removeItem(STORAGE_USER_EMAIL);
};

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    signup: (name: string, email: string, password: string) =>
      request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      }),
    me: () => request<UserMetrics>('/auth/me'),
    updateProfile: (data: { name?: string; avatarUrl?: string }) =>
      request<UserMetrics>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: boolean }>('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword })
      }),
    deleteAccount: () =>
      request<{ success: boolean }>('/auth/account', { method: 'DELETE' })
  },

  dashboard: {
    getMetrics: (period: 'weekly' | 'monthly' | 'yearly' = 'monthly') =>
      request<DashboardMetrics>(`/dashboard/metrics?period=${period}`),
    getLeaderboard: () =>
      request<{ data: LeaderboardEntry[] }>('/dashboard/leaderboard').then((r) => r.data),
    getActivity: (limit = 50) =>
      request<{ data: ActivityEntry[] }>(`/dashboard/activity?limit=${limit}`).then((r) => r.data)
  },

  stats: {
    global: () => request<GlobalStats>('/stats/global')
  },

  suggestions: {
    getDaily: () => request<Suggestion[]>('/suggestions'),
    actionSuggestion: (id: string, action: 'accept' | 'dismiss') =>
      request<{ success: boolean; updatedUser?: UserMetrics }>(`/suggestions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      }),
    generate: () =>
      request<{ success: boolean; count: number; suggestions: Suggestion[] }>(
        '/suggestions/generate',
        { method: 'POST' }
      )
  },

  simulator: {
    whatIf: (
      habits: Array<{ habit: string; value: number }>
    ) =>
      request<{
        savingsPercent: number;
        carbonSavedKg: number;
        rupeesSavedInr: number;
        annualCarbonSavedKg: number;
        annualRupeesSavedInr: number;
        breakdown: Record<string, any>;
      }>('/simulator/what-if', {
        method: 'POST',
        body: JSON.stringify({ habits })
      })
  },

  chat: {
    sendMessage: (
      message: string,
      history: Array<{ role: string; content: string }> = []
    ) =>
      request<{ text: string; timestamp: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history })
      })
  },

  ingest: {
    browser: (data: {
      tabCount?: number;
      videoHours?: number;
      videoQuality?: string;
      searchCount?: number;
      emailMb?: number;
      isDarkMode?: boolean;
      directNavigationCount?: number;
    }) =>
      request<{ success: boolean; impact: any; updatedEcoScore: number }>(
        '/ingest/browser',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    hardware: (data: {
      sleepHours?: number;
      brightnessReductionPercent?: number;
      smartChargingEnabled?: boolean;
      unpluggedHours?: number;
      peripheralsDisconnected?: number;
    }) =>
      request<{ success: boolean; impact: any; updatedEcoScore: number }>(
        '/ingest/hardware',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    lifestyle: (data: {
      acTempIncrease?: number;
      meatFreeDays?: number;
      publicTransportDays?: number;
      paperlessPages?: number;
      deviceFreeHours?: number;
    }) =>
      request<{ success: boolean; impact: any; updatedEcoScore: number }>(
        '/ingest/lifestyle',
        { method: 'POST', body: JSON.stringify(data) }
      )
  },

  exportEsgUrl: (format: 'csv' | 'json' = 'csv') =>
    `${BASE_URL}/export/esg?format=${format}`
};

export const getStoredUserId = () => localStorage.getItem(STORAGE_USER_ID) || '';
export const getStoredToken = () => localStorage.getItem(STORAGE_TOKEN) || '';
