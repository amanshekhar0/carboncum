import { useEffect, useState } from 'react';
import { Check, X, Bot, Loader2, RefreshCw, Monitor, Zap, Leaf, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { api, ApiError, Suggestion } from '../../services/api';
import { useDashboard } from '../../services/DashboardContext';

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

const categoryIcon = (category: string) => {
  switch (category) {
    case 'Browser':
      return <Monitor className="w-3 h-3 mr-1" />;
    case 'Hardware':
      return <Zap className="w-3 h-3 mr-1" />;
    case 'Lifestyle':
      return <Leaf className="w-3 h-3 mr-1" />;
    default:
      return <Globe className="w-3 h-3 mr-1" />;
  }
};

export function ActionCenter() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const { refresh, applyUserPatch } = useDashboard();

  const loadSuggestions = async () => {
    setLoading(true);
    setAiUnavailable(false);
    try {
      const data = await api.suggestions.getDaily();
      setSuggestions(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setAiUnavailable(true);
      } else {
        toast.error('Could not load AI suggestions');
      }
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'dismiss') => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    try {
      const result = await api.suggestions.actionSuggestion(id, action);
      if (action === 'accept') {
        toast.success('Action accepted', {
          description: 'Your Eco-Score and totals just updated.'
        });
        if (result.updatedUser) {
          applyUserPatch(result.updatedUser);
        }
        refresh();
      } else {
        toast('Suggestion dismissed');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update suggestion';
      toast.error(message);
      loadSuggestions();
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await api.suggestions.generate();
      toast.success('Fresh AI suggestions generated');
      await loadSuggestions();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not regenerate suggestions';
      if (err instanceof ApiError && err.status === 503) setAiUnavailable(true);
      toast.error(message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            AI Coach Suggestions
          </CardTitle>
          <CardDescription>
            Personalized actions based on your real activity log
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            {suggestions.length} pending
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleRegenerate}
            disabled={regenerating || aiUnavailable}
            title="Regenerate AI suggestions"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-xs text-muted-foreground">Loading suggestions…</p>
          </div>
        ) : aiUnavailable ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm font-medium">AI Coach is offline</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Set <code>GROQ_API_KEY</code> on the backend to enable personalized AI suggestions.
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm">All caught up.</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Log some activity (or click below) and the Coach will tailor a fresh batch of
              suggestions to your real habits.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              Generate suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-secondary/50 rounded-lg p-4 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center ${categoryColor(suggestion.category)}`}
                      >
                        {categoryIcon(suggestion.category)}
                        {suggestion.category}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs font-medium text-emerald-400">
                          Save ₹{suggestion.potentialSavingsInr.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.potentialSavingsKg.toFixed(2)} kg CO₂
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-4">{suggestion.text}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAction(suggestion.id, 'accept')}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleAction(suggestion.id, 'dismiss')}
                      >
                        <X className="w-4 h-4 mr-1" /> Dismiss
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
