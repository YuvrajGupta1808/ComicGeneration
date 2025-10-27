import { Image, Palette, Zap } from 'lucide-react';
import React from 'react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Palette,
      title: "Multiple Art Styles",
      description: "Choose from Manga, Western Comic, or Watercolor styles. Each with unique aesthetics and professional quality.",
    },
    {
      icon: Zap,
      title: "AI-Powered Generation",
      description: "State-of-the-art Leonardo AI generates stunning artwork from your text descriptions in seconds.",
    },
    {
      icon: Image,
      title: "Custom References",
      description: "Upload character and background references to maintain consistency throughout your comic.",
    },
  ];

  return (
    <div id="features" className="py-24 px-6 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">
            Everything you need to create
          </h2>
          <p className="text-[18px] text-gray-700 dark:text-neutral-300 max-w-2xl mx-auto font-medium">
            Professional comic creation tools powered by advanced AI technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="group cursor-pointer bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 dark:border-neutral-800 hover:border-indigo-300/50 dark:hover:border-indigo-600/50 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/30 transition-all">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl group-hover:scale-110 transition-transform shadow-md">
                  <feature.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-neutral-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
