import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api, ApiError, Suggestion } from '../../services/api';
import { useDashboard } from '../../services/DashboardContext';

interface SimResult {
  savingsPercent: number;
  carbonSavedKg: number;
  rupeesSavedInr: number;
  annualCarbonSavedKg: number;
  annualRupeesSavedInr: number;
}

const EMPTY_RESULT: SimResult = {
  savingsPercent: 0,
  carbonSavedKg: 0,
  rupeesSavedInr: 0,
  annualCarbonSavedKg: 0,
  annualRupeesSavedInr: 0
};

export function WhatIfSimulator() {
  const { refresh } = useDashboard();

  const [videoQuality, setVideoQuality] = useState([50]);
  const [acTemp, setAcTemp] = useState([50]);
  const [zombieTabs, setZombieTabs] = useState([50]);
  const [diet, setDiet] = useState([20]);
  const [paperless, setPaperless] = useState([10]);
  const [deviceFree, setDeviceFree] = useState([5]);

  const [simulation, setSimulation] = useState<SimResult>(EMPTY_RESULT);
  const [isRunning, setIsRunning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [tips, setTips] = useState<Suggestion[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [actingTipId, setActingTipId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      setIsRunning(true);
      try {
        const result = await api.simulator.whatIf([
          { habit: 'videoQuality', value: videoQuality[0] },
          { habit: 'acTemp', value: acTemp[0] },
          { habit: 'zombieTabs', value: zombieTabs[0] },
          { habit: 'diet', value: diet[0] },
          { habit: 'paperless', value: paperless[0] },
          { habit: 'deviceFree', value: deviceFree[0] }
        ]);
        if (!active) return;
        setSimulation({
          savingsPercent: result.savingsPercent,
          carbonSavedKg: result.carbonSavedKg,
          rupeesSavedInr: result.rupeesSavedInr,
          annualCarbonSavedKg: result.annualCarbonSavedKg,
          annualRupeesSavedInr: result.annualRupeesSavedInr
        });
      } catch (err) {
        if (active) {
          const message = err instanceof ApiError ? err.message : 'Simulation failed';
          toast.error(message);
        }
      } finally {
        if (active) setIsRunning(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [videoQuality, acTemp, zombieTabs, diet, paperless, deviceFree]);

  const loadTips = async (forceNew = false) => {
    setTipsLoading(true);
    try {
      if (forceNew) {
        await api.suggestions.generate();
      }
      const data = await api.suggestions.getDaily();
      const rotated = [...data].sort(() => Math.random() - 0.5);
      setTips(rotated.slice(0, 5));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load AI recommendations';
      toast.error(message);
    } finally {
      setTipsLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, []);

  const applyHabits = async () => {
    setApplying(true);
    try {
      await api.ingest.lifestyle({
        acTempIncrease: Math.round(acTemp[0] / 12.5), // 0..8
        meatFreeDays: Math.round(diet[0] / 10),
        paperlessPages: Math.round(paperless[0] * 2),
        deviceFreeHours: Math.round(deviceFree[0] / 10)
      });
      const inactiveTabsLogged = Math.max(0, Math.round(100 - zombieTabs[0]));
      await api.ingest.browser({
        tabCount: inactiveTabsLogged,
        videoQuality: videoQuality[0] < 33 ? '4K' : videoQuality[0] < 66 ? '1080p' : '720p',
        videoHours: 1,
        isDarkMode: true
      });
      toast.success('Habits applied to your account', {
        description: 'Your dashboard, score and activity log just updated.'
      });
      await refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not apply habits';
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  const applyTip = async (id: string, action: 'accept' | 'dismiss') => {
    setActingTipId(id);
    try {
      await api.suggestions.actionSuggestion(id, action);
      setTips((prev) => prev.filter((tip) => tip.id !== id));
      if (action === 'accept') {
        toast.success('AI recommendation applied');
        await refresh();
      } else {
        toast.success('Recommendation dismissed');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update recommendation';
      toast.error(message);
    } finally {
      setActingTipId(null);
    }
  };

  const AnimatedNumber = ({
    value,
    prefix = '',
    suffix = ''
  }: {
    value: number;
    prefix?: string;
    suffix?: string;
  }) => (
    <motion.span
      key={value.toFixed(2)}
      initial={{ scale: 1.15, color: '#10b981' }}
      animate={{ scale: 1, color: '#e5e7eb' }}
      transition={{ duration: 0.3 }}
      className="text-xl font-bold block"
    >
      {prefix}
      {value.toFixed(2)}
      {suffix}
    </motion.span>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          What-If Simulator
        </CardTitle>
        <CardDescription>
          Project daily savings before you commit. Click "Apply" to write these habits to your real activity log.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-h-none lg:max-h-[500px] overflow-visible lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Video quality</label>
            <span className="text-sm text-muted-foreground">
              {videoQuality[0] < 33 ? '4K' : videoQuality[0] < 66 ? '1080p' : '720p'}
            </span>
          </div>
          <Slider value={videoQuality} onValueChange={setVideoQuality} max={100} step={1} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">AC thermostat</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(18 + (acTemp[0] / 100) * 8)}°C
            </span>
          </div>
          <Slider value={acTemp} onValueChange={setAcTemp} max={100} step={1} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Inactive tabs to close</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(zombieTabs[0])} closed
            </span>
          </div>
          <Slider value={zombieTabs} onValueChange={setZombieTabs} max={100} step={1} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Meat-free meals</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(diet[0] / 10)} per week
            </span>
          </div>
          <Slider value={diet} onValueChange={setDiet} max={100} step={1} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Paperless transition</label>
            <span className="text-sm text-muted-foreground">{paperless[0]}% digital</span>
          </div>
          <Slider value={paperless} onValueChange={setPaperless} max={100} step={1} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Device-free hours</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(deviceFree[0] / 10)} h / day
            </span>
          </div>
          <Slider value={deviceFree} onValueChange={setDeviceFree} max={100} step={1} />
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <div
            className={`grid grid-cols-2 gap-3 transition-opacity ${
              isRunning ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Daily CO₂ saved</p>
              <AnimatedNumber value={simulation.carbonSavedKg} suffix=" kg" />
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Daily ₹ saved</p>
              <AnimatedNumber value={simulation.rupeesSavedInr} prefix="₹" />
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Annual projection</p>
              <p className="text-sm font-semibold text-emerald-400">
                {simulation.annualCarbonSavedKg.toFixed(1)} kg CO₂ · ₹
                {simulation.annualRupeesSavedInr.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-11"
            disabled={applying || simulation.carbonSavedKg === 0}
            onClick={applyHabits}
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying…
              </>
            ) : (
              'Apply to my account'
            )}
          </Button>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-200">More AI actions you can follow</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => loadTips(true)}
                disabled={tipsLoading}
              >
                {tipsLoading ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                )}
                New set
              </Button>
            </div>

            {tips.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  No pending recommendations right now. Click below to generate more AI actions.
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
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs">
                        {tip.category}
                      </Badge>
                      <span className="text-xs text-emerald-300">
                        {tip.potentialSavingsKg.toFixed(2)} kg | ₹{tip.potentialSavingsInr.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-sm">{tip.text}</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingTipId === tip.id}
                        onClick={() => applyTip(tip.id, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={actingTipId === tip.id}
                        onClick={() => applyTip(tip.id, 'accept')}
                      >
                        {actingTipId === tip.id ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
