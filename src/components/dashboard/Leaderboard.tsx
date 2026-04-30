import { useEffect, useState } from 'react';
import { Trophy, Loader2, RefreshCw, Users } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { api, ApiError, getStoredUserId, LeaderboardEntry } from '../../services/api';
import { toast } from 'sonner';

export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const currentUserId = getStoredUserId();

  const fetchLeaders = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const data = await api.dashboard.getLeaderboard();
      setLeaders(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (manual) {
        const message = err instanceof ApiError ? err.message : 'Could not refresh leaderboard';
        toast.error(message);
      }
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
    const interval = setInterval(fetchLeaders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            {leaders.length > 0
              ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`
              : 'Real-time ranking by Eco-Score'}
          </CardDescription>
        </div>
        <button
          onClick={() => fetchLeaders(true)}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh leaderboard"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No ranked users yet</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              The leaderboard will populate as soon as users start logging real activity.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((user, index) => {
              const isCurrentUser = String(user.id) === currentUserId;
              return (
                <div
                  key={user.id || index}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    isCurrentUser
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 text-center text-sm font-bold text-muted-foreground">
                      {index === 0
                        ? '🥇'
                        : index === 1
                        ? '🥈'
                        : index === 2
                        ? '🥉'
                        : index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2 truncate">
                        <span className="truncate">{user.name}</span>
                        {isCurrentUser && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 py-0 border-emerald-500/50 text-emerald-400"
                          >
                            You
                          </Badge>
                        )}
                      </p>
                      {user.streak > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          🔥 {user.streak} day streak · {user.carbonSaved.toFixed(1)} kg saved
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{user.score}</p>
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
