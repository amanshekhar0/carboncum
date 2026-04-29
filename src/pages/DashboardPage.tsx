import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Overview } from '../components/dashboard/Overview';
import { WhatIfSimulator } from '../components/dashboard/WhatIfSimulator';
import { Leaderboard } from '../components/dashboard/Leaderboard';
import { ActionCenter } from '../components/dashboard/ActionCenter';
import { Chatbot } from '../components/dashboard/Chatbot';
import { Toaster } from '../components/ui/sonner';
import { api } from '../services/api';
import { MOCK_USER } from '../services/mockData';

import { FullPageCoach } from '../components/dashboard/FullPageCoach';
import { SettingsView } from '../components/dashboard/SettingsView';

export function DashboardPage() {
  const [user, setUser] = useState<any>(MOCK_USER);

  useEffect(() => {
    const savedTheme = localStorage.getItem('carbontwin_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const loadData = async () => {
      try {
        const data = await api.dashboard.getMetrics();
        if (data?.user) setUser(data.user);
      } catch (err) {
        console.error('Failed to load user data');
      }
    };

    loadData();
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CarbonTwin</h1>
              <p className="text-muted-foreground">
                Your real-time digital sustainability command center.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">
                  Live Data
                </span>
              </div>
              <a
                href="http://localhost:3001/api/export/esg?format=csv"
                target="_blank"
                rel="noreferrer"
                download={`CarbonTwin_ESG_Report_${new Date().toISOString()}.csv`}
                className="text-xs bg-secondary hover:bg-secondary/80 border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              >
                Export ESG CSV
              </a>
            </div>
          </div>

          <Routes>
            <Route index element={<Overview />} />
            <Route path="activity" element={<ActionCenter />} />
            <Route path="simulator" element={<WhatIfSimulator />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="coach" element={<FullPageCoach />} />
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