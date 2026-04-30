import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Trophy,
  Settings,
  Bot,
  Leaf,
  LogOut,
  Sliders,
  Sun,
  Moon,
  MapPin
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { clearAuth } from '../../services/api';
import type { UserMetrics } from '../../services/api';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
  { icon: Sliders, label: 'Simulator', path: '/dashboard/simulator' },
  { icon: Trophy, label: 'Leaderboard', path: '/dashboard/leaderboard' },
  { icon: Bot, label: 'AI Coach', path: '/dashboard/coach' },
  { icon: MapPin, label: 'Transit Scan', path: '/dashboard/scan' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' }
];

interface SidebarProps {
  user: UserMetrics | null;
}

export function Sidebar({ user }: SidebarProps) {
  const location = useLocation();
  const [isDark, setIsDark] = React.useState(() =>
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('carbontwin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('carbontwin_theme', 'light');
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/auth';
  };

  const initials = (user?.name || 'CT')
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Leaf className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Carbon<span className="text-emerald-500">Twin</span>
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="mb-6 px-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/dashboard' && location.pathname === '/dashboard/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar>
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {user?.name || 'Loading…'}
            </span>
            <span className="text-xs text-muted-foreground">
              Score: {user?.ecoScore ?? 0}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
