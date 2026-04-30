import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Loader2, Sprout } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { useDashboard } from '../../services/DashboardContext';

const periods: Array<{ label: string; value: 'weekly' | 'monthly' | 'yearly' }> = [
  { label: '7D', value: 'weekly' },
  { label: '30D', value: 'monthly' },
  { label: '1Y', value: 'yearly' }
];

export function ImpactChart() {
  const { chartData, loading, period, setPeriod } = useDashboard();

  const hasAnyData = chartData.some((d) => d.co2 > 0 || d.saved > 0);

  return (
    <Card className="col-span-1 lg:col-span-2 bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Impact Chart</CardTitle>
          <CardDescription>
            CO₂ emitted vs CO₂ saved per day. Built from your real activity log.
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
        {loading && chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : !hasAnyData ? (
          <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sprout className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-sm font-medium">No activity in this period yet.</p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              Log a habit, scan a transit ticket or accept a coach suggestion. Your real impact will
              appear here automatically.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="5 5"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#4b5563"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                  tick={{ fill: '#9ca3af' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#4b5563"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}kg`}
                  tick={{ fill: '#f87171' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#4b5563"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}kg`}
                  tick={{ fill: '#34d399' }}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: 'rgba(9, 9, 11, 0.95)',
                    borderColor: 'rgba(52, 211, 153, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    padding: '12px',
                    borderWidth: '1px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="co2"
                  name="CO₂ Emitted"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCo2)"
                  animationDuration={1500}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="saved"
                  name="CO₂ Saved"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSaved)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
