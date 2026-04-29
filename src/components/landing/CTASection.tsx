import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-900/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{
            opacity: 0,
            y: 30
          }}
          whileInView={{
            opacity: 1,
            y: 0
          }}
          viewport={{
            once: true
          }}
          className="max-w-4xl mx-auto text-center bg-card/50 backdrop-blur-xl border border-emerald-500/30 p-12 rounded-3xl shadow-2xl">
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to stop burning money and carbon?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Deploy CarbonTwin to your organization in minutes. Watch your
            employees compete to reduce your AWS bill and carbon footprint.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-emerald-500/30 hover:bg-emerald-500/10 w-full sm:w-auto">
              
              Schedule Demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. 14-day free trial for up to 50 users.
          </p>
        </motion.div>
      </div>
    </section>);

}