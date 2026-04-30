import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, Brain, Zap, ShieldCheck, RefreshCw, User as UserIcon } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { api, ApiError } from '../../services/api';
import { useDashboard } from '../../services/DashboardContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Explain my Eco-Score',
  'What should I do next?',
  'Compare me to a typical user'
];

export function FullPageCoach() {
  const { user } = useDashboard();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "I have full context on your activity. Ask me to interpret your numbers, suggest the next best action, or explain how a habit affects your score."
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const response = await api.chat.sendMessage(userMsg, history.slice(0, -1));
      setMessages((prev) => [...prev, { role: 'assistant', content: response.text }]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "I couldn't reach the AI service. Please try again shortly.";
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
    } finally {
      setIsTyping(false);
    }
  };

  const insights = [
    `Your Eco-Score is ${user?.ecoScore ?? 0}/100.`,
    `${(user?.totalCarbonSaved ?? 0).toFixed(1)} kg CO₂ saved so far.`,
    `Current streak: ${user?.currentStreak ?? 0} day(s).`
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20 p-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4" />
            Live context
          </h3>
          <div className="space-y-3">
            <div className="p-2 bg-black/20 rounded-md border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">User</p>
              <p className="text-xs text-foreground font-medium">{user?.name || 'Loading…'}</p>
            </div>
            <div className="p-2 bg-black/20 rounded-md border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Eco-Score</p>
              <p className="text-xs text-foreground font-medium">{user?.ecoScore ?? 0}/100</p>
            </div>
            <div className="p-2 bg-black/20 rounded-md border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Streak</p>
              <p className="text-xs text-foreground font-medium">
                {user?.currentStreak ?? 0} day(s)
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20 p-4">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" />
            Your insights
          </h3>
          <ul className="text-[11px] space-y-2 text-muted-foreground">
            {insights.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="lg:col-span-3 flex flex-col bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground flex items-center gap-2">
                Eco-Coach Pro
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </h2>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Llama 3.3 · grounded in your real activity
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold"
          >
            <ShieldCheck className="w-3 h-3 mr-1 inline" />
            Private context
          </Badge>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <UserIcon className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-secondary/80 text-foreground rounded-tl-sm border border-border'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start gap-3">
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-secondary/80 text-foreground rounded-2xl rounded-tl-sm px-4 py-3 border border-border flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Thinking</span>
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border bg-background/50">
          <form onSubmit={handleSend} className="flex gap-3 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your carbon footprint…"
              className="flex-1 bg-secondary border-border focus-visible:ring-emerald-500 h-12 text-base"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 bg-emerald-600 hover:bg-emerald-500 shrink-0 shadow-lg shadow-emerald-500/20"
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <div className="mt-3 flex justify-center gap-4">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="text-[10px] text-muted-foreground hover:text-emerald-400 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
