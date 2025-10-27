import { CheckCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const ArtStylesSection: React.FC = () => {
  const artStyles = [
    {
      emoji: "📖",
      title: "Manga Style",
      description: "Japanese comic aesthetics with bold lines and dramatic expressions.",
      features: ["Speed lines & effects", "Expressive characters"],
      gradient: "from-indigo-100 to-purple-100",
      hoverGradient: "from-indigo-200 to-purple-200",
      borderHover: "hover:border-indigo-300/50 hover:shadow-indigo-500/10",
    },
    {
      emoji: "💥",
      title: "Western Comic",
      description: "Classic superhero style with vibrant colors and bold outlines.",
      features: ["Vibrant colors", "Action-packed scenes"],
      gradient: "from-orange-100 to-red-100",
      hoverGradient: "from-orange-200 to-red-200",
      borderHover: "hover:border-orange-300/50 hover:shadow-orange-500/10",
    },
    {
      emoji: "🎨",
      title: "Watercolor Story",
      description: "Soft, artistic watercolor style perfect for emotional storytelling.",
      features: ["Soft dreamy colors", "Emotional depth"],
      gradient: "from-pink-100 to-purple-100",
      hoverGradient: "from-pink-200 to-purple-200",
      borderHover: "hover:border-pink-300/50 hover:shadow-pink-500/10",
    },
  ];

  return (
    <div className="py-24 px-6 bg-gradient-to-b from-blue-100/30 via-purple-100/40 to-pink-100/50 dark:from-neutral-900/50 dark:via-neutral-900/60 dark:to-neutral-900/70 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-5 tracking-tight">Three stunning art styles</h2>
          <p className="text-[18px] text-gray-700 dark:text-neutral-300 font-medium">Choose the perfect style for your story</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {artStyles.map((style, index) => (
            <Link 
              key={index}
              to="/create" 
              className={`bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-neutral-800 overflow-hidden hover:shadow-2xl ${style.borderHover} dark:hover:border-indigo-600/50 dark:hover:shadow-indigo-900/30 transition-all group cursor-pointer transform hover:scale-[1.02]`}
            >
              <div className={`aspect-[4/3] bg-gradient-to-br ${style.gradient} dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center group-hover:${style.hoverGradient} transition-all`}>
                <div className="text-7xl">{style.emoji}</div>
              </div>
              <div className="p-7">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{style.title}</h3>
                <p className="text-gray-600 dark:text-neutral-400 text-[15px] mb-4 leading-relaxed">{style.description}</p>
                <ul className="space-y-2.5 text-sm text-gray-600 dark:text-neutral-400">
                  {style.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtStylesSection;
