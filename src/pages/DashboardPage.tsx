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
import { Cloud, IndianRupee, Trophy, Flame } from 'lucide-react';

import { FullPageCoach } from '../components/dashboard/FullPageCoach';
import { SettingsView } from '../components/dashboard/SettingsView';
import { CommuteScanner } from '../components/dashboard/CommuteScanner';

import { io } from 'socket.io-client';

export function DashboardPage() {
  const [user, setUser] = useState<any>({ name: '', ecoScore: 0, currentStreak: 0, totalCarbonSaved: 0, totalRupeesSaved: 0 });

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

    // 🌐 Socket.io Real-Time Connection
    const userId = localStorage.getItem('carbontwin_userId');
    const socket = io('http://localhost:3001');
    
    if (userId) {
      socket.emit('join', userId);
      socket.on('metrics_update', (data) => {
        console.log('[Real-Time] Metrics updated via socket');
        if (data) setUser(data);
        else loadData(); // Full refresh if no data passed
      });
    }

    loadData();

    return () => {
      socket.disconnect();
    };
  }, []);

  const cards = [
    {
      title: 'Total Carbon Saved',
      value: `${user.totalCarbonSaved || 0} kg`,
      icon: <Cloud className="h-4 w-4 text-blue-400" />
    },
    {
      title: 'Total Rupees Saved',
      value: `₹${Number(user.totalRupeesSaved || 0).toLocaleString('en-IN')}`,
      icon: <IndianRupee className="h-4 w-4 text-emerald-400" />
    },
    {
      title: 'Eco-Score',
      value: `${user.ecoScore || 0}/100`,
      icon: <Trophy className="h-4 w-4 text-yellow-400" />
    },
    {
      title: 'Current Streak',
      value: `${user.currentStreak || 0} Days`,
      icon: <Flame className="h-4 w-4 text-orange-400" />
    }
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CarbonTwin</h1>
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