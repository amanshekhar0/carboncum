import { Cloud, IndianRupee, Trophy, Flame, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDashboard } from '../../services/DashboardContext';

export function MetricsCards() {
  const { user, loading } = useDashboard();

  const cards = [
    {
      title: 'Total Carbon Saved',
      value: `${(user?.totalCarbonSaved ?? 0).toFixed(2)} kg`,
      subtext: 'Across every action you logged',
      icon: <Cloud className="h-4 w-4 text-blue-400" />
    },
    {
      title: 'Total Rupees Saved',
      value: `₹${Number(user?.totalRupeesSaved ?? 0).toLocaleString('en-IN', {
        maximumFractionDigits: 0
      })}`,
      subtext: 'Estimated savings from greener habits',
      icon: <IndianRupee className="h-4 w-4 text-emerald-400" />
    },
    {
      title: 'Eco-Score',
      value: `${user?.ecoScore ?? 0}/100`,
      subtext:
        (user?.ecoScore ?? 0) >= 80
          ? 'Outstanding efficiency'
          : (user?.ecoScore ?? 0) >= 50
          ? 'Good momentum – keep going'
          : 'Log activity to grow your score',
      icon: <Trophy className="h-4 w-4 text-yellow-400" />
    },
    {
      title: 'Current Streak',
      value: `${user?.currentStreak ?? 0} ${
        (user?.currentStreak ?? 0) === 1 ? 'Day' : 'Days'
      }`,
      subtext: 'Consecutive days of action',
      icon: <Flame className="h-4 w-4 text-orange-400" />
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            {loading && !user ? (
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
