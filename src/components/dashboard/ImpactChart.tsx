import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../../services/api';
import { MOCK_CHART_DATA } from '../../services/mockData';
import { Loader2 } from 'lucide-react';

const periods = [
  { label: '7D', value: 'weekly' },
  { label: '30D', value: 'monthly' },
  { label: '1Y', value: 'yearly' }
];

export function ImpactChart() {
  const [chartData, setChartData] = useState<any[]>(MOCK_CHART_DATA);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await api.dashboard.getMetrics(period);
        if (data?.chartData?.length > 0) {
          setChartData(data.chartData);
        }
      } catch {
        setChartData(MOCK_CHART_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  return (
    <Card className="col-span-1 lg:col-span-2 bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unified Impact Chart</CardTitle>
          <CardDescription>
            Daily CO₂ emissions vs ₹ saved over time
          </CardDescription>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${
                period === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}kg`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="co2"
                  name="CO₂ Emitted (kg)"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorCo2)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="saved"
                  name="₹ Saved"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorSaved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}