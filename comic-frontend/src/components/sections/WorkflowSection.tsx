import React from 'react';

const WorkflowSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Choose your style",
      description: "Select from Manga, Western Comic, or Watercolor style. Pick the aesthetic that matches your story vision.",
    },
    {
      number: "02",
      title: "Write prompts & add references",
      description: "Describe each panel with text prompts. Optionally upload character references to maintain consistent characters throughout your comic.",
    },
    {
      number: "03",
      title: "Generate & download",
      description: "Click generate and watch AI create your comic in minutes. Download as high-quality PDF and share with the world!",
    },
  ];

  return (
    <div id="workflow" className="py-24 px-6 backdrop-blur-sm relative z-10">
      <div className="max-w-4xl mx-auto">

        <div className="space-y-5">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6 p-7 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-pointer">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform shadow-md">
                {step.number}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2.5">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowSection;
