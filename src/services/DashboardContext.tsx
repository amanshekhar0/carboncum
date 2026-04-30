import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  api,
  ApiError,
  ChartPoint,
  ActivityEntry,
  UserMetrics,
  getStoredToken,
  getStoredUserId
} from './api';

const SOCKET_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SOCKET_URL) ||
  'http://localhost:3001';

export type ChartPeriod = 'weekly' | 'monthly' | 'yearly';

interface DashboardState {
  user: UserMetrics | null;
  chartData: ChartPoint[];
  recentActivity: ActivityEntry[];
  loading: boolean;
  error: string | null;
  period: ChartPeriod;
  setPeriod: (p: ChartPeriod) => void;
  refresh: () => Promise<void>;
  applyUserPatch: (patch: Partial<UserMetrics>) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>('monthly');
  const socketRef = useRef<Socket | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await api.dashboard.getMetrics(period);
      setUser(data.user);
      setChartData(data.chartData || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const applyUserPatch = useCallback((patch: Partial<UserMetrics>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!getStoredToken()) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    const userId = getStoredUserId();
    if (userId) {
      socket.emit('join', userId);
    }

    socket.on('metrics_update', (incoming: Partial<UserMetrics> | null) => {
      if (incoming) {
        applyUserPatch(incoming);
      }
      // Refresh chart + activity in the background
      refresh();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [applyUserPatch, refresh]);

  const value = useMemo<DashboardState>(
    () => ({
      user,
      chartData,
      recentActivity,
      loading,
      error,
      period,
      setPeriod,
      refresh,
      applyUserPatch
    }),
    [user, chartData, recentActivity, loading, error, period, refresh, applyUserPatch]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return ctx;
}
