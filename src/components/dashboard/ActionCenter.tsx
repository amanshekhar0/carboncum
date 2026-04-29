import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, X, Bot, Loader2, RefreshCw, Monitor, Smartphone, Leaf, Zap, Globe } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function ActionCenter() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await api.suggestions.getDaily();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'dismiss') => {
    // Optimistic UI update
    setSuggestions((prev) => prev.filter((s) => s.id !== id));

    if (action === 'accept') {
      toast.success('Action accepted! Carbon savings recorded.', {
        description: 'Your Eco-Score will update shortly.'
      });
    } else {
      toast.info('Suggestion dismissed.');
    }

    try {
      await api.suggestions.actionSuggestion(id, action);
    } catch {
      // If API fails, silently ignore – UI already updated
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await api.suggestions.generate();
      toast.success('New AI suggestions generated!');
      await loadSuggestions();
    } catch {
      toast.error('Could not regenerate suggestions. Try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Browser': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Hardware': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Lifestyle': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Browser': return <Monitor className="w-3 h-3 mr-1" />;
      case 'Hardware': return <Zap className="w-3 h-3 mr-1" />;
      case 'Lifestyle': return <Leaf className="w-3 h-3 mr-1" />;
      default: return <Globe className="w-3 h-3 mr-1" />;
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
          <CardDescription>Daily personalized actions to reduce footprint</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          >
            {suggestions.length} Pending
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleRegenerate}
            disabled={regenerating}
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
            <p className="text-xs text-muted-foreground">Consulting Groq AI for your personalized suggestions...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground">All caught up! Great job today. 🌱</p>
            <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
              Get New Suggestions
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
                        className={`text-xs flex items-center ${getCategoryColor(suggestion.category)}`}
                      >
                        {getCategoryIcon(suggestion.category)}
                        {suggestion.category}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs font-medium text-emerald-400">
                          Save ₹{suggestion.potentialSavingsInr}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.potentialSavingsKg}kg CO₂
                        </p>
                      </div>
                    </div>
                    {/* Support both .text and .suggestionText field names */}
                    <p className="text-sm text-foreground mb-4">
                      {suggestion.text || suggestion.suggestionText}
                    </p>
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