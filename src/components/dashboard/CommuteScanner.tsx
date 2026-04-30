import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Ticket,
  MapPin,
  Bus,
  Train,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
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
import { getStoredToken } from '../../services/api';
import { useDashboard } from '../../services/DashboardContext';

const SCAN_URL = `${
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:3001/api'
}/sustainability/scan-ticket`;

interface ScanResult {
  origin: string;
  destination: string;
  transportMode: string;
  distanceKm: number;
  carbonSaved: number;
  rupeesSaved: number;
  pointsAwarded: number;
  newEcoScore: number;
}

export function CommuteScanner() {
  const { refresh } = useDashboard();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File is too large (max 10MB)');
        return;
      }
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = getStoredToken();
      const response = await fetch(SCAN_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.data);
        toast.success(`Earned ${data.data.pointsAwarded} Eco-Points`);
        refresh();
      } else {
        const message = data.error || 'Could not process ticket. Please try again.';
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection error. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Smart Commute Scanner</h2>
        <p className="text-muted-foreground text-sm">
          Upload a transit ticket. We extract the route with vision AI, compute CO₂ saved vs.
          driving and award Eco-Points.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Best results with clear photo + route text visible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border overflow-hidden relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-emerald-500" />
              Transit ticket
            </CardTitle>
            <CardDescription>Bus, metro or train ticket. JPEG or PNG, up to 10MB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!preview ? (
              <label className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-secondary/50 transition-all group">
                <input
                  type="file"
                  className="hidden"
                  onChange={onFileChange}
                  accept="image/png,image/jpeg"
                />
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Drop your ticket here</p>
                  <p className="text-xs text-muted-foreground">JPEG / PNG, up to 10MB</p>
                </div>
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-black/20">
                <img
                  src={preview}
                  alt="Ticket preview"
                  className="w-full h-full object-contain"
                />

                {isScanning && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
                  />
                )}

                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center flex-col gap-3"
                    >
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      <p className="text-sm font-bold text-white tracking-widest uppercase">
                        Reading ticket…
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isScanning && !result && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 h-8"
                    onClick={reset}
                  >
                    Change
                  </Button>
                )}
              </div>
            )}

            {!result && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500 h-11"
                disabled={!file || isScanning}
                onClick={handleUpload}
              >
                {isScanning ? 'Processing…' : 'Scan & save carbon'}
              </Button>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              key="result"
            >
              <Card className="bg-emerald-500/5 border-emerald-500/20 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Scan successful
                    </CardTitle>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3">
                      +{result.pointsAwarded} points
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      {result.transportMode === 'train' ? (
                        <Train className="text-emerald-400" />
                      ) : (
                        <Bus className="text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div className="text-center px-2">
                        <p className="text-[10px] uppercase text-muted-foreground">Origin</p>
                        <p className="text-sm font-bold">{result.origin}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="text-center px-2">
                        <p className="text-[10px] uppercase text-muted-foreground">Destination</p>
                        <p className="text-sm font-bold">{result.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-1">CO₂ saved vs driving</p>
                    <motion.h3
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      {result.carbonSaved.toFixed(2)} kg
                    </motion.h3>
                    <p className="text-xs text-emerald-500/80 mt-2 font-medium flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />~{result.distanceKm.toFixed(1)} km of {result.transportMode} · ₹{result.rupeesSaved.toFixed(0)} saved
                    </p>
                  </div>

                  <Button variant="outline" className="w-full" onClick={reset}>
                    Scan another ticket
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key="placeholder"
              className="h-full"
            >
              <Card className="bg-secondary/20 border-border border-dashed h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-muted-foreground">Awaiting scan</h3>
                <p className="text-sm text-muted-foreground/60 max-w-[260px] mt-2">
                  Upload a ticket to see the route, CO₂ saved and Eco-Points awarded.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
