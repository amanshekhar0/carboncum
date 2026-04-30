import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useGlobalStats } from '../../services/useGlobalStats';

const AnimatedCounter = ({
  value,
  prefix = '',
  suffix = '',
  duration = 2
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let frame = 0;
    const totalFrames = Math.round(duration * 60);
    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(value * eased);
      if (frame === totalFrames) {
        clearInterval(counter);
        setCount(value);
      }
    }, 1000 / 60);
    return () => clearInterval(counter);
  }, [isInView, value, duration]);

  const formatted =
    value >= 1000 ? Math.floor(count).toLocaleString('en-IN') : count.toFixed(0);

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export function StatsSection() {
  const { stats, loading } = useGlobalStats();

  const items = [
    {
      label: 'CO₂ saved (kg)',
      value: stats?.totalCarbonSavedKg ?? 0,
      prefix: '',
      suffix: ' kg'
    },
    {
      label: 'Rupees saved',
      value: stats?.totalRupeesSaved ?? 0,
      prefix: '₹',
      suffix: ''
    },
    {
      label: 'Avg Eco-Score',
      value: stats?.averageEcoScore ?? 0,
      prefix: '',
      suffix: '/100'
    },
    {
      label: 'Active members',
      value: stats?.totalUsers ?? 0,
      prefix: '',
      suffix: ''
    }
  ];

  return (
    <section className="py-20 border-y border-border bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            Live platform numbers
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Computed in real time from real activity – no marketing fluff.
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {items.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center justify-center p-6"
            >
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
                {loading ? (
                  '—'
                ) : (
                  <AnimatedCounter
                    value={Math.max(0, Math.round(item.value))}
                    prefix={item.prefix}
                    suffix={item.suffix}
                  />
                )}
              </div>
              <p className="text-muted-foreground font-medium">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
