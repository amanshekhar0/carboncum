import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, Brain, Zap, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { api } from '../../services/api';
import { Card } from '../ui/card';

export function FullPageCoach() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to your immersive AI Sustainability Command Center. I'm analyzing your real-time carbon footprint. What's our next move?"
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
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages as any);
    setIsTyping(true);

    try {
      const userId = localStorage.getItem('carbontwin_userId') || '';
      const history = newMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const response = await api.chat.sendMessage(userMsg, history.slice(0, -1), userId);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }] as any);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "My AI neurons are firing slowly. Try again." }] as any);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar Stats */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20 p-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4" />
            AI Context
          </h3>
          <div className="space-y-3">
            <div className="p-2 bg-black/20 rounded-md border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Current Focus</p>
              <p className="text-xs text-white font-medium">Digital Habit Optimization</p>
            </div>
            <div className="p-2 bg-black/20 rounded-md border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Knowledge Base</p>
              <p className="text-xs text-white font-medium">Global ESG Standards v2.4</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20 p-4">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" />
            Quick Insights
          </h3>
          <ul className="text-[11px] space-y-2 text-muted-foreground">
            <li className="flex gap-2">• AC Temp +1°C saves ₹120/mo</li>
            <li className="flex gap-2">• Dark mode reduces eye strain 15%</li>
            <li className="flex gap-2">• Closing tabs frees 2GB RAM</li>
          </ul>
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="lg:col-span-3 flex flex-col bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground flex items-center gap-2">
                Groq Eco-Coach Pro
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </h2>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Llama 3.3 Versatile Active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Enterprise
            </Badge>
          </div>
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
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
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
              placeholder="Ask anything about your carbon footprint..."
              className="flex-1 bg-secondary border-border focus-visible:ring-emerald-500 h-12 text-base"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 bg-emerald-600 hover:bg-emerald-500 shrink-0 shadow-lg shadow-emerald-500/20"
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-5 h-5" />
            </Button>
          </form>
          <div className="mt-3 flex justify-center gap-4">
             <button className="text-[10px] text-muted-foreground hover:text-emerald-400 transition-colors">Explain my Eco-Score</button>
             <button className="text-[10px] text-muted-foreground hover:text-emerald-400 transition-colors">Next best action?</button>
             <button className="text-[10px] text-muted-foreground hover:text-emerald-400 transition-colors">Compare with org average</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${className}`}>
      {children}
    </span>
  )
}
