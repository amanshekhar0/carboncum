import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Mail, Lock, User, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await api.auth.login(formData.email, formData.password);
        localStorage.setItem('carbontwin_token', res.token);
        localStorage.setItem('carbontwin_userId', res.user.id);
        toast.success(`Welcome back, ${res.user.name}!`);
      } else {
        const res = await api.auth.signup(formData.name, formData.email, formData.password);
        localStorage.setItem('carbontwin_token', res.token);
        localStorage.setItem('carbontwin_userId', res.user.id);
        toast.success("Account created successfully!");
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Leaf className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Carbon<span className="text-emerald-500">Twin</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Enterprise Sustainability</p>
            </div>
          </div>
        </div>

        <Card className="bg-white/[0.03] border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Movement'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Enter your credentials to access your twin.' : 'Start tracking your digital carbon footprint today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <Input
                      required={!isLogin}
                      placeholder="Aarav Sharma"
                      className="pl-10 bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl h-11 text-white"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input
                  required
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl h-11 text-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl h-11 text-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-zinc-500 hover:text-emerald-500 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </Card>

        {/* Feature badges */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
          <div className="flex items-center gap-2 text-[10px] text-white uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Enterprise Grade
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-blue-500" />
            AI Insights
          </div>
        </div>
      </motion.div>
    </div>
  );
}
