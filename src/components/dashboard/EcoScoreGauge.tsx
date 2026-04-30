import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDashboard } from '../../services/DashboardContext';

const tagline = (score: number, hasActivity: boolean) => {
  if (!hasActivity && score === 0) return 'Log activity to start growing your score.';
  if (score >= 90) return "Outstanding. You're an Eco-Warrior.";
  if (score >= 70) return 'Strong momentum — keep stacking actions.';
  if (score >= 40) return 'Good start. A few more habits will lift your score quickly.';
  return 'Plenty of room to grow. The Coach has actionable suggestions.';
};

export function EcoScoreGauge() {
  const { user } = useDashboard();
  const score = user?.ecoScore ?? 0;
  const hasActivity = (user?.totalCarbonSaved ?? 0) > 0 || (user?.currentStreak ?? 0) > 0;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="bg-card border-border overflow-hidden group">
      <CardHeader>
        <CardTitle className="text-center text-zinc-400 text-sm font-medium uppercase tracking-wider">
          Your Eco-Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pb-8 pt-2">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
          <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-in-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-foreground tracking-tighter">{score}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">
              Efficiency
            </span>
          </div>
        </div>
        <p className="text-xs text-center text-zinc-400 mt-6 max-w-[220px] leading-relaxed">
          {tagline(score, hasActivity)}
        </p>
      </CardContent>
    </Card>
  );
}
