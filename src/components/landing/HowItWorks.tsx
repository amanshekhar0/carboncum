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
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
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

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, x: -50, filter: 'blur(10px)' },
                visible: { 
                  opacity: 1, 
                  x: 0, 
                  filter: 'blur(0px)',
                  transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }
                }
              }}
              whileHover={{ 
                y: -10,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              className="relative group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-colors"
            >
              <div className={`w-14 h-14 rounded-2xl bg-${step.color}-500/10 flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300 relative`}>
                <div className={`absolute inset-0 bg-${step.color}-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <step.icon className={`w-7 h-7 text-${step.color}-500 relative z-10`} />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-500 transition-colors">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.15 }}
                  className="hidden lg:block absolute top-12 -right-4 z-10 text-emerald-500/30"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
