import { Navbar } from '../components/landing/Navbar';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Footer } from '../components/landing/Footer';
import { motion } from 'framer-motion';

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center mb-12"
           >
             <h1 className="text-5xl font-extrabold mb-4">Carbon Reduction <span className="text-emerald-500">Science</span></h1>
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
               Our platform uses enterprise-grade monitoring and AI optimization to eliminate digital waste.
             </p>
           </motion.div>
        </div>
        <HowItWorks />
        
        <div className="container mx-auto px-4 py-12">
           <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <h2 className="text-3xl font-bold">Privacy-First Ingestion</h2>
                 <p className="text-muted-foreground">
                   We don't track what you do—we track the energy your machine consumes while you do it. Our agents measure CPU cycles, memory usage, and network overhead to calculate your real-time carbon cost.
                 </p>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       No keystroke logging or screen recording
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       Encrypted data transmission (AES-256)
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       GDPR and CCPA compliant architecture
                    </li>
                 </ul>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 aspect-square flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
                 <div className="text-center relative z-10 space-y-3">
                    <div className="text-5xl font-black text-emerald-500 mb-2">0.71</div>
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">kg CO₂ / kWh</p>
                    <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                      India CEA grid intensity factor (2023). Multiplied by PUE 1.2, this drives every CarbonTwin calculation.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
