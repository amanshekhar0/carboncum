import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Bot, Trophy, Laptop, Zap, LineChart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
'../ui/card';
const features = [
{
  title: 'Real-time Telemetry',
  description:
  'Our Chrome Extension silently tracks browser tabs, video quality, and cloud usage to calculate your exact digital footprint.',
  icon: <Activity className="w-6 h-6 text-emerald-400" />,
  delay: 0.1
},
{
  title: 'Aggressive AI Coach',
  description:
  "Powered by Grok API, our AI doesn't sugarcoat. It analyzes your habits and demands changes that save money and carbon.",
  icon: <Bot className="w-6 h-6 text-emerald-400" />,
  delay: 0.2
},
{
  title: 'Gamified Eco-Scores',
  description:
  'Compete with coworkers on the live leaderboard. Earn points for sustainable habits and trade them peer-to-peer.',
  icon: <Trophy className="w-6 h-6 text-emerald-400" />,
  delay: 0.3
},
{
  title: 'Hardware Lifecycle ML',
  description:
  'Predict exactly when to replace employee laptops based on battery degradation logs to maximize eco-efficiency.',
  icon: <Laptop className="w-6 h-6 text-emerald-400" />,
  delay: 0.4
},
{
  title: 'Doomscroll Tax Engine',
  description:
  'Infinite scrolling burns carbon. We calculate the cost of social media binges and trigger browser warnings.',
  icon: <Zap className="w-6 h-6 text-emerald-400" />,
  delay: 0.5
},
{
  title: 'ESG Export for CFOs',
  description:
  'One-click generation of Scope 2 and Scope 3 digital emissions reports formatted perfectly for corporate compliance.',
  icon: <LineChart className="w-6 h-6 text-emerald-400" />,
  delay: 0.6
}];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-secondary/30 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            The complete toolkit for{' '}
            <span className="text-emerald-400">digital sustainability</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We don't just measure carbon. We attach a rupee value to it, gamify
            the reduction process, and use AI to enforce better habits.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) =>
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true,
              margin: '-100px'
            }}
            transition={{
              duration: 0.5,
              delay: feature.delay
            }}>
            
              <Card className="h-full bg-card border-border hover:border-emerald-500/50 transition-colors group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}