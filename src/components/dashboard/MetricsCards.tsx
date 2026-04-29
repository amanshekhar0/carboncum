import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Cloud, IndianRupee, Trophy, Flame, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { MOCK_USER } from '../../services/mockData';

export function MetricsCards() {
  const [user, setUser] = useState<any>({ totalCarbonSaved: 0, totalRupeesSaved: 0, ecoScore: 0, currentStreak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.dashboard.getMetrics();
        if (data?.user) setUser(data.user);
      } catch (e) {
        // Keep 0s
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    {
      title: 'Total Carbon Saved',
      value: `${user.totalCarbonSaved || 0} kg`,
      subtext: 'Tracking real-time impact',
      icon: <Cloud className="h-4 w-4 text-blue-400" />
    },
    {
      title: 'Total Rupees Saved',
      value: `₹${Number(user.totalRupeesSaved || 0).toLocaleString('en-IN')}`,
      subtext: 'Money saved via efficiency',
      icon: <IndianRupee className="h-4 w-4 text-emerald-400" />
    },
    {
      title: 'Eco-Score',
      value: `${user.ecoScore || 0}/100`,
      subtext: 'Your current efficiency grade',
      icon: <Trophy className="h-4 w-4 text-yellow-400" />
    },
    {
      title: 'Current Streak',
      value: `${user.currentStreak || 0} Days`,
      subtext: 'Activity consistency',
      icon: <Flame className="h-4 w-4 text-orange-400" />
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            {loading ? (
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