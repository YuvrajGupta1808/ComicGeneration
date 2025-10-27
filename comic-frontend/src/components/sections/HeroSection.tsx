import { Sparkles } from 'lucide-react';
import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-900 px-4 py-2.5 rounded-full text-sm font-semibold border border-indigo-200/50 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Powered by Leonardo AI</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-[64px] lg:text-[72px] font-bold text-center text-gray-900 mb-8 leading-[1.1] tracking-tight">
          Create stunning comics<br />in minutes, not hours.
        </h1>

        {/* Subheading */}
        <p className="text-[18px] text-center text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Transform your stories into professional comics with AI. Choose from multiple art styles—no drawing skills required.
        </p>

      </div>
    </div>
  );
};

export default HeroSection;
