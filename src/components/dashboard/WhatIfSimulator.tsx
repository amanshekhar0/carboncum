import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Slider } from '../ui/slider';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Button } from '../ui/button';

interface SimResult {
  savingsPercent: number;
  carbonSavedKg: number;
  rupeesSavedInr: number;
  annualCarbonSavedKg?: number;
  annualRupeesSavedInr?: number;
}

export function WhatIfSimulator() {
  const [videoQuality, setVideoQuality] = useState([50]);
  const [acTemp, setAcTemp] = useState([50]);
  const [zombieTabs, setZombieTabs] = useState([50]);
  const [diet, setDiet] = useState([20]);
  const [paperless, setPaperless] = useState([10]);
  const [deviceFree, setDeviceFree] = useState([5]);

  const [simulation, setSimulation] = useState<SimResult>({
    savingsPercent: 0,
    carbonSavedKg: 0,
    rupeesSavedInr: 0,
    annualCarbonSavedKg: 0,
    annualRupeesSavedInr: 0
  });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const runSimulation = async () => {
      setIsRunning(true);
      try {
        // Batch all sliders into one request
        const res = await fetch('http://localhost:3001/api/simulator/what-if', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            habits: [
              { habit: 'videoQuality', value: videoQuality[0] },
              { habit: 'acTemp', value: acTemp[0] },
              { habit: 'zombieTabs', value: zombieTabs[0] },
              { habit: 'diet', value: diet[0] },
              { habit: 'paperless', value: paperless[0] },
              { habit: 'deviceFree', value: deviceFree[0] }
            ]
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSimulation(data);
        } else {
          // Fallback local calculation
          const vq = await api.simulator.whatIf('videoQuality', videoQuality[0]);
          const ac = await api.simulator.whatIf('acTemp', acTemp[0]);
          const zt = await api.simulator.whatIf('zombieTabs', zombieTabs[0]);
          const dt = await api.simulator.whatIf('diet', diet[0]);
          const pl = await api.simulator.whatIf('paperless', paperless[0]);
          const df = await api.simulator.whatIf('deviceFree', deviceFree[0]);
          setSimulation({
            savingsPercent: vq.savingsPercent + ac.savingsPercent + zt.savingsPercent + dt.savingsPercent + pl.savingsPercent + df.savingsPercent,
            carbonSavedKg: vq.carbonSavedKg + ac.carbonSavedKg + zt.carbonSavedKg + dt.carbonSavedKg + pl.carbonSavedKg + df.carbonSavedKg,
            rupeesSavedInr: vq.rupeesSavedInr + ac.rupeesSavedInr + zt.rupeesSavedInr + dt.rupeesSavedInr + pl.rupeesSavedInr + df.rupeesSavedInr
          });
        }
      } catch {
        // Fallback calculation when backend unavailable
        const totalCarbon = videoQuality[0] * 0.05 + acTemp[0] * 0.12 + zombieTabs[0] * 0.02 + diet[0] * 0.033 + paperless[0] * 0.01 + deviceFree[0] * 0.08;
        const totalRupees = videoQuality[0] * 0.8 + acTemp[0] * 1.5 + zombieTabs[0] * 0.3 + diet[0] * 1.5 + paperless[0] * 0.5 + deviceFree[0] * 0.6;
        setSimulation({
          savingsPercent: videoQuality[0] * 0.4 + acTemp[0] * 0.6 + zombieTabs[0] * 0.15 + diet[0] * 0.33 + paperless[0] * 0.1 + deviceFree[0] * 0.25,
          carbonSavedKg: totalCarbon,
          rupeesSavedInr: totalRupees,
          annualCarbonSavedKg: totalCarbon * 365,
          annualRupeesSavedInr: totalRupees * 365
        });
      } finally {
        setIsRunning(false);
      }
    };

    // Debounce slider changes by 200ms to avoid API spam
    timeout = setTimeout(runSimulation, 200);
    return () => clearTimeout(timeout);
  }, [videoQuality, acTemp, zombieTabs, diet, paperless, deviceFree]);

  const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => (
    <motion.span
      key={value.toFixed(2)}
      initial={{ scale: 1.15, color: '#10b981' }}
      animate={{ scale: 1, color: '#e5e7eb' }}
      transition={{ duration: 0.3 }}
      className="text-xl font-bold block"
    >
      {prefix}{value.toFixed(2)}{suffix}
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
          Adjust habits to see projected daily savings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {/* Video Quality Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Video Quality</label>
            <span className="text-sm text-muted-foreground">
              {videoQuality[0] < 33 ? '4K' : videoQuality[0] < 66 ? '1080p' : '720p'}
            </span>
          </div>
          <Slider
            value={videoQuality}
            onValueChange={setVideoQuality}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>

        {/* AC Thermostat Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">AC Thermostat</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(18 + acTemp[0] / 100 * 8)}°C
            </span>
          </div>
          <Slider
            value={acTemp}
            onValueChange={setAcTemp}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>

        {/* Zombie Tabs Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Open Tabs</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(100 - zombieTabs[0])} tabs
            </span>
          </div>
          <Slider
            value={zombieTabs}
            onValueChange={setZombieTabs}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>

        {/* Meat-Free Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Meat-Free Meals</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(diet[0] / 10)} per week
            </span>
          </div>
          <Slider
            value={diet}
            onValueChange={setDiet}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>

        {/* Paperless Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Paperless Transition</label>
            <span className="text-sm text-muted-foreground">
              {paperless[0]}% digital
            </span>
          </div>
          <Slider
            value={paperless}
            onValueChange={setPaperless}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>

        {/* Device-Free Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Device-Free Hours</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(deviceFree[0] / 10)}h / day
            </span>
          </div>
          <Slider
            value={deviceFree}
            onValueChange={setDeviceFree}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className={`grid grid-cols-2 gap-3 transition-opacity ${isRunning ? 'opacity-60' : 'opacity-100'}`}>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Daily CO₂ Savings</p>
              <AnimatedNumber value={simulation.carbonSavedKg} suffix=" kg" />
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Daily ₹ Savings</p>
              <AnimatedNumber value={simulation.rupeesSavedInr} prefix="₹" />
            </div>
            {simulation.annualCarbonSavedKg !== undefined && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Annual Projection</p>
                <p className="text-sm font-semibold text-emerald-400">
                  {simulation.annualCarbonSavedKg?.toFixed(1)} kg CO₂ · ₹{simulation.annualRupeesSavedInr?.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-11"
            disabled={isRunning || simulation.carbonSavedKg === 0}
            onClick={async () => {
              try {
                // Apply these as real lifestyle habits
                await api.ingest.lifestyle({
                  acTempIncrease: Math.round(acTemp[0] / 10),
                  meatFreeDays: Math.round(diet[0] / 10),
                  publicTransportDays: 0 // not in simulator yet
                });
                // Also some browser/hardware habits
                await api.ingest.browser({
                  tabCount: Math.round(100 - zombieTabs[0]),
                  videoQuality: videoQuality[0] < 33 ? '4K' : '1080p'
                });
                
                alert("Habits applied! Your Eco-Score will update shortly.");
                window.location.reload(); // Refresh to see updates everywhere
              } catch (err) {
                console.error("Failed to apply habits");
              }
            }}
          >
            Apply to My Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}