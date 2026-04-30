import { motion } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  BarChart3, 
  Globe2, 
  ArrowRight,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const enterpriseFeatures = [
  {
    icon: Globe2,
    title: "Global Fleet Monitoring",
    description: "Monitor Scope 2 & 3 emissions across thousands of workstations, servers, and cloud instances in real-time."
  },
  {
    icon: ShieldCheck,
    title: "Automated ESG Auditing",
    description: "Generate boardroom-ready reports compliant with ISO 14064-1 and GRI standards with a single click."
  },
  {
    icon: BarChart3,
    title: "Predictive Cost Analysis",
    description: "AI models forecast energy price fluctuations and suggest digital optimizations to avoid peak tariff charges."
  },
  {
    icon: Building2,
    title: "Organization Hierarchy",
    description: "Granular control over departments, regions, and cost centers to identify local sustainability champions."
  }
];

export function EnterpriseDemoPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest"
            >
              <Zap className="w-3 h-3" />
              Enterprise Solutions
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-7xl font-black tracking-tight leading-[1.05]"
            >
              Sustainability at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Scale.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              CarbonTwin Enterprise provides multi-national organizations the tools to track, report, and reduce their digital carbon footprint across the entire value chain.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-lg font-bold">
                  Try the live demo <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 rounded-xl text-lg">
                  How it works
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview Mockup */}
        <section className="container mx-auto px-4 mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-6xl mx-auto rounded-[32px] border border-white/10 bg-zinc-900/50 p-4 aspect-[16/9] overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
              alt="Enterprise Dashboard Preview" 
              className="w-full h-full object-cover rounded-2xl opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(37,99,235,0.5)] animate-pulse cursor-pointer">
                    <ChevronRight className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="font-bold uppercase tracking-widest text-sm text-blue-400">Watch Enterprise Walkthrough</p>
               </div>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-24 border-t border-white/5">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto rounded-[40px] bg-gradient-to-br from-blue-600 to-emerald-600 p-12 md:p-20 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
             <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl font-black">Built for teams that ship.</h2>
                <p className="text-xl text-white/80 max-w-2xl mx-auto">
                  CarbonTwin is open-source and self-hostable. Sign up to try the same dashboard
                  every team member sees, then deploy it to your own org with one repo.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="h-16 px-12 bg-white text-blue-600 hover:bg-zinc-100 rounded-2xl text-xl font-black shadow-xl">
                    Try the live demo
                  </Button>
                </Link>
             </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
