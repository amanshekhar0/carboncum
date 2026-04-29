import React, { useEffect } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { StatsSection } from '../components/landing/StatsSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';
export function LandingPage() {
  // Ensure dark mode is active for the landing page
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {

      // We'll keep dark mode for the whole app as requested
    };}, []);
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-emerald-500/30">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <HowItWorks />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>);

}