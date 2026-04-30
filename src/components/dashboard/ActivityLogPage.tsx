import { useEffect, useMemo, useState } from 'react';
import { Activity, Loader2, Monitor, Zap, Leaf, RefreshCw, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api, ApiError, ActivityEntry, Suggestion } from '../../services/api';

const categoryIcon = (category: string) => {
  switch (category) {
    case 'Browser':
      return <Monitor className="w-3.5 h-3.5" />;
    case 'Hardware':
      return <Zap className="w-3.5 h-3.5" />;
    case 'Lifestyle':
      return <Leaf className="w-3.5 h-3.5" />;
    default:
      return <Activity className="w-3.5 h-3.5" />;
  }
};

const categoryColor = (category: string) => {
  switch (category) {
    case 'Browser':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Hardware':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'Lifestyle':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [tips, setTips] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [actingTipId, setActingTipId] = useState<string | null>(null);

  const loadTips = async (forceNew = false) => {
    setTipsLoading(true);
    try {
      if (forceNew) {
        await api.suggestions.generate();
      }
      const data = await api.suggestions.getDaily();
      // Rotate tips order so each refresh can show a different sequence.
      const rotated = [...data].sort(() => Math.random() - 0.5);
      setTips(rotated.slice(0, 4));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load recommendations';
      toast.error(message);
    } finally {
      setTipsLoading(false);
    }
  };

  const load = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await api.dashboard.getActivity(100);
      setEntries(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load activity log';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    loadTips();
  }, []);

  const categoryClass = useMemo(
    () => ({
      Browser: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      Hardware: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
      Lifestyle: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    }),
    []
  );

  const actOnTip = async (id: string, action: 'accept' | 'dismiss') => {
    setActingTipId(id);
    try {
      await api.suggestions.actionSuggestion(id, action);
      setTips((prev) => prev.filter((tip) => tip.id !== id));
      if (action === 'accept') {
        toast.success('Recommendation applied and logged');
        await load(true);
      } else {
        toast.success('Recommendation dismissed');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update recommendation';
      toast.error(message);
    } finally {
      setActingTipId(null);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Every action you log is computed against the CarbonTwin engine with real CO2 and INR impact.
          </CardDescription>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => load(true)}
          disabled={refreshing}
          className="h-8 w-8"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-200">AI Daily Recommendations</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => loadTips(true)}
              disabled={tipsLoading}
            >
              {tipsLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Refresh tips
            </Button>
          </div>
          {tips.length === 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                No pending tips right now. Generate a fresh batch to get new AI recommendations.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadTips(true)}
                disabled={tipsLoading}
              >
                {tipsLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                Generate tips
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tips.map((tip) => (
                <div key={tip.id} className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={categoryClass[tip.category] || 'bg-muted text-muted-foreground'}
                    >
                      {tip.category}
                    </Badge>
                    <span className="text-xs text-emerald-300">
                      Save {tip.potentialSavingsKg.toFixed(2)} kg CO2 | ₹
                      {tip.potentialSavingsInr.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{tip.text}</p>
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actingTipId === tip.id}
                      onClick={() => actOnTip(tip.id, 'dismiss')}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      disabled={actingTipId === tip.id}
                      onClick={() => actOnTip(tip.id, 'accept')}
                    >
                      {actingTipId === tip.id ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-sm font-medium">No activity yet.</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Apply a habit from the simulator, scan a transit ticket or accept a coach suggestion.
              Each action you take will appear here with its real CO₂ and ₹ impact.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => {
              const isPositive = entry.carbonImpact < 0; // saved
              return (
                <div key={entry._id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3 first:pt-0 last:pb-0">
                  <Badge
                    variant="outline"
                    className={`text-xs flex items-center gap-1 ${categoryColor(entry.category)}`}
                  >
                    {categoryIcon(entry.category)}
                    {entry.category}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{entry.actionName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isPositive ? '−' : '+'}
                      {Math.abs(entry.carbonImpact).toFixed(3)} kg CO₂
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isPositive ? '−' : '+'}₹{Math.abs(entry.costImpact).toFixed(2)}
                    </p>
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
