import React from 'react';
import AppNavbar from '../components/AppNavbar';
import ArtStylesSection from '../components/sections/ArtStylesSection';
import CTASection from '../components/sections/CTASection';
import ExamplesCarousel from '../components/sections/ExamplesCarousel';
import FeaturesSection from '../components/sections/FeaturesSection';
import Footer from '../components/sections/Footer';
import { BackgroundPaths } from '../components/ui/background-paths';

interface LandingProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Landing: React.FC<LandingProps> = ({ isAuthenticated, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/30 via-blue-100/40 to-indigo-100/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      {/* Animated Background */}
      <BackgroundPaths title="ComicGen AI" />
      
      {/* Global Navbar */}
      <AppNavbar isAuthenticated={isAuthenticated} onLogout={onLogout} />


      {/* Features Section */}
      <FeaturesSection />

      {/* Art Styles Section */}
      <ArtStylesSection />

      {/* Examples Carousel */}
      <ExamplesCarousel />

      {/* Workflow Section moved to /how-it-works */}

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;