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
  title: 'Real activity ingestion',
  description:
  'Browser, hardware and lifestyle events feed a single carbon engine that uses India CEA grid intensity (0.71 kg CO₂/kWh, 2023) to compute your real footprint.',
  icon: <Activity className="w-6 h-6 text-emerald-400" />,
  delay: 0.1
},
{
  title: 'AI Eco-Coach',
  description:
  "Powered by Groq's Llama 3.3, the coach grounds every reply in your real activity log to suggest changes that actually save money and carbon.",
  icon: <Bot className="w-6 h-6 text-emerald-400" />,
  delay: 0.2
},
{
  title: 'Gamified Eco-Scores',
  description:
  'A live leaderboard and streaks turn small daily habits into a high-score game. Earn Eco-Points and trade them with other users.',
  icon: <Trophy className="w-6 h-6 text-emerald-400" />,
  delay: 0.3
},
{
  title: 'Hardware-aware tracking',
  description:
  'Sleep mode, screen brightness and unplugged peripherals all feed into the same engine, so hardware habits earn the credit they deserve.',
  icon: <Laptop className="w-6 h-6 text-emerald-400" />,
  delay: 0.4
},
{
  title: 'Doomscroll alerts',
  description:
  'The optional Chrome extension warns you when you have been scrolling on social media for too long and shows the carbon cost in real time.',
  icon: <Zap className="w-6 h-6 text-emerald-400" />,
  delay: 0.5
},
{
  title: 'ESG-ready CSV export',
  description:
  'Generate a Scope 2 / Scope 3 CSV from your real activity in one click – useful for personal records or hackathon judges.',
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
            We measure carbon, attach a rupee value to it, gamify the reduction loop, and let an
            AI coach grounded in your real data tell you what to change next.
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