import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  Download,
  Loader2,
  LayoutDashboard,
  Activity,
  Sliders,
  Trophy,
  Bot,
  MapPin,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

import { Sidebar } from '../components/dashboard/Sidebar';
import { Overview } from '../components/dashboard/Overview';
import { WhatIfSimulator } from '../components/dashboard/WhatIfSimulator';
import { Leaderboard } from '../components/dashboard/Leaderboard';
import { Chatbot } from '../components/dashboard/Chatbot';
import { Toaster } from '../components/ui/sonner';
import { FullPageCoach } from '../components/dashboard/FullPageCoach';
import { SettingsView } from '../components/dashboard/SettingsView';
import { CommuteScanner } from '../components/dashboard/CommuteScanner';
import { ActivityLogPage } from '../components/dashboard/ActivityLogPage';

import { DashboardProvider, useDashboard } from '../services/DashboardContext';
import { api, getStoredToken } from '../services/api';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
  { icon: Activity, label: 'Activity', path: '/dashboard/activity' },
  { icon: Sliders, label: 'Sim', path: '/dashboard/simulator' },
  { icon: Trophy, label: 'Leaders', path: '/dashboard/leaderboard' },
  { icon: Bot, label: 'Coach', path: '/dashboard/coach' },
  { icon: MapPin, label: 'Scan', path: '/dashboard/scan' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' }
];

function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const response = await fetch(api.exportEsgUrl('csv'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CarbonTwin_ESG_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('ESG report downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Could not download ESG report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-xs bg-secondary hover:bg-secondary/80 border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      Export ESG CSV
    </button>
  );
}

function MobileDashboardNav() {
  const location = useLocation();

  return (
    <div className="lg:hidden sticky top-0 z-20 -mx-4 px-4 py-2 mb-3 bg-background/90 backdrop-blur border-b border-border/60">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {mobileNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname === '/dashboard/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-secondary/40 text-muted-foreground border-border'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DashboardShell() {
  const { user, loading, error } = useDashboard();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  React.useEffect(() => {
    if (!loading && !error) {
      setLastSyncedAt(new Date());
    }
  }, [loading, error, user?.ecoScore, user?.totalCarbonSaved, user?.totalRupeesSaved]);

  return (
    <div className="flex min-h-screen lg:h-screen bg-background text-foreground overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <MobileDashboardNav />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CarbonTwin</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.name
                  ? `Welcome back, ${user.name.split(' ')[0]}. Your metrics are calculated from real activity logs.`
                  : 'Loading your live dashboard...'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {error ? (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                  <span className="flex h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-sm font-medium text-red-300">Needs attention</span>
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span className="text-sm font-medium text-amber-300">Syncing</span>
                </div>
              ) : (
                <div className="flex flex-col bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-400">Live</span>
                  </div>
                  {lastSyncedAt && (
                    <span className="text-[10px] text-emerald-300/80">
                      Last synced at{' '}
                      {lastSyncedAt.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              )}
              <ExportButton />
            </div>
          </div>

          <Routes>
            <Route index element={<Overview />} />
            <Route path="activity" element={<ActivityLogPage />} />
            <Route path="simulator" element={<WhatIfSimulator />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="coach" element={<FullPageCoach />} />
            <Route path="scan" element={<CommuteScanner />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>

      <Chatbot />
      <Toaster theme="dark" />
    </div>
  );
}

export function DashboardPage() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('carbontwin_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  );
}
