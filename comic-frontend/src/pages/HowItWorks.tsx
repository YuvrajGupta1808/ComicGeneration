import React from 'react';
import AppNavbar from '../components/AppNavbar';
import ExamplesCarousel from '../components/sections/ExamplesCarousel';
import Footer from '../components/sections/Footer';
import WorkflowSection from '../components/sections/WorkflowSection';

const HowItWorks: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/30 via-blue-100/40 to-indigo-100/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <AppNavbar />

      {/* Hero */}
      <section className="pt-28 pb-6 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">How it works</h1>
          <p className="text-lg text-gray-600 dark:text-neutral-400 max-w-2xl mx-auto">
            From a simple prompt to a full comic in minutes. See the steps and what's possible with ComicGen AI.
          </p>
        <WorkflowSection />
        </div>
      </section>



      {/* See what's possible */}
      <section className="py-8">
        <ExamplesCarousel />
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;


