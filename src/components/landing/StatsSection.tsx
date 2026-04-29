import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
const AnimatedCounter = ({
  value,
  prefix = '',
  suffix = '',
  duration = 2





}: {value: number;prefix?: string;suffix?: string;duration?: number;}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-50px'
  });
  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalFrames = Math.round(duration * 60);
      let frame = 0;
      const counter = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        // Ease out expo
        const easeProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(start + (end - start) * easeProgress);
        if (frame === totalFrames) {
          clearInterval(counter);
          setCount(value);
        }
      }, 1000 / 60);
      return () => clearInterval(counter);
    }
  }, [isInView, value, duration]);
  // Format number with commas
  const formattedCount = Math.floor(count).toLocaleString('en-IN');
  return (
    <span ref={ref}>
      {prefix}
      {formattedCount}
      {suffix}
    </span>);

};
export function StatsSection() {
  return (
    <section className="py-20 border-y border-border bg-background relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
            className="flex flex-col items-center justify-center p-6">
            
            <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
              <AnimatedCounter value={45200} suffix=" kg" />
            </div>
            <p className="text-muted-foreground font-medium">CO₂ Prevented</p>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: 0.1
            }}
            className="flex flex-col items-center justify-center p-6">
            
            <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
              <AnimatedCounter value={565000} prefix="₹" />
            </div>
            <p className="text-muted-foreground font-medium">
              Corporate Savings
            </p>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: 0.2
            }}
            className="flex flex-col items-center justify-center p-6">
            
            <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
              <AnimatedCounter value={92} suffix="%" />
            </div>
            <p className="text-muted-foreground font-medium">
              Avg. Habit Change
            </p>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            whileInView={{
              opacity: 1,
              scale: 1
            }}
            viewport={{
              once: true
            }}
            transition={{
              delay: 0.3
            }}
            className="flex flex-col items-center justify-center p-6">
            
            <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
              <AnimatedCounter value={124} suffix="+" />
            </div>
            <p className="text-muted-foreground font-medium">
              Enterprise Clients
            </p>
          </motion.div>
        </div>
      </div>
    </section>);

}