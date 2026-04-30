import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../ui/button';

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-900/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-card/50 backdrop-blur-xl border border-emerald-500/30 p-12 rounded-3xl shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            See your real footprint. Then shrink it.
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Sign up free, log a few habits, and watch CarbonTwin turn your activity into a real
            Eco-Score backed by India CEA grid data and an AI coach.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth">
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
              >
                Create free account <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-emerald-500/30 hover:bg-emerald-500/10 w-full sm:w-auto"
              >
                See the science
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Open-source hackathon project. No credit card. No marketing emails.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
