import React from 'react';
import { motion } from 'framer-motion';
import { 
  Scan, 
  Cpu, 
  Bot, 
  Trophy,
  ArrowRight
} from 'lucide-react';

const steps = [
  {
    title: "1. Real-time Ingestion",
    description: "Our lightweight agents monitor your digital footprint—from browser tabs to hardware energy draw—without ever compromising privacy.",
    icon: Scan,
    color: "emerald"
  },
  {
    title: "2. AI Digital Twin",
    description: "CarbonTwin creates a real-time digital mirror of your organization's energy usage, identifying invisible waste patterns instantly.",
    icon: Cpu,
    color: "blue"
  },
  {
    title: "3. AI-Driven Coaching",
    description: "Our Llama-3 powered Eco-Coach provides aggressive, contextual nudges to help employees reduce waste in the moment.",
    icon: Bot,
    color: "emerald"
  },
  {
    title: "4. Global Impact",
    description: "Watch your collective Eco-Score rise. Trade points, compete on leaderboards, and generate automated ESG compliance reports.",
    icon: Trophy,
    color: "blue"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            How <span className="text-emerald-500">CarbonTwin</span> Works
          </motion.h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From local data ingestion to global ESG compliance, we automate every step of your digital sustainability journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-${step.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className={`w-6 h-6 text-${step.color}-500`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 z-10 text-border">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
