import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { MOCK_LEADERBOARD } from '../../services/mockData';

export function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaders = async () => {
    try {
      const data = await api.dashboard.getLeaderboard();
      setLeaders(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch {
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
    // Poll every 30s to simulate real-time updates
    const interval = setInterval(fetchLeaders, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentUserId = localStorage.getItem('carbontwin_userId');

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Company Leaderboard
          </CardTitle>
          <CardDescription>
            Live Eco-Scores · Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </CardDescription>
        </div>
        <button
          onClick={fetchLeaders}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh leaderboard"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((user, index) => {
              const isCurrentUser = user.id === currentUserId || user.isCurrentUser;
              return (
                <div
                  key={user.id || index}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    isCurrentUser
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-sm font-bold text-muted-foreground">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {user.name}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-emerald-500/50 text-emerald-400">
                            You
                          </Badge>
                        )}
                      </p>
                      {user.streak > 0 && (
                        <p className="text-[10px] text-muted-foreground">🔥 {user.streak} day streak</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">{user.score}</p>
                    </div>
                    {user.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {user.trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive" />}
                    {user.trend === 'same' && <Minus className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}