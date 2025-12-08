import { ArrowRight, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/sections/Footer';

const CreateComic: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  const handleStart = () => {
    if (!prompt.trim()) {
      return;
    }
    navigate('/chat', { state: { initialPrompt: prompt } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-blue-50/50 to-indigo-50/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex flex-col">
      <AppNavbar />
      
      <div className="flex-1 flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-neutral-900/60 dark:to-neutral-800/60 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 px-5 py-2.5 rounded-full text-sm font-semibold border border-indigo-200 dark:border-neutral-700 shadow-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Create Your Comic</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              What's your story?
            </h1>
            <p className="text-lg text-gray-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Describe your comic idea and let AI bring it to life
            </p>
          </div>

          {/* Prompt Input */}
          <div className="relative mb-6">
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              placeholder="A superhero saving the city from a giant robot..."
              className="w-full min-h-[180px] p-7 pr-20 rounded-3xl border-2 border-indigo-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-indigo-600/30 focus:border-indigo-400/70 dark:focus:border-indigo-600/70 resize-none text-lg shadow-lg transition-all"
              rows={5}
              autoFocus
            />
            <button
              onClick={handleStart}
              disabled={!prompt.trim()}
              className="absolute bottom-7 right-7 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-2xl transform hover:scale-110 disabled:hover:scale-100 active:scale-95"
              title="Start creating"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-neutral-500 text-center mb-16">
            Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">Enter</kbd> to start or <kbd className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-xs font-mono">Shift+Enter</kbd> for new line
          </p>

          {/* Example Prompts */}
          <div className="mt-16">
            <p className="text-base font-semibold text-gray-700 dark:text-neutral-300 mb-6 text-center">
              Need inspiration? Try these:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'A detective solving a mystery in a cyberpunk city',
                'Two friends on an adventure through a magical forest',
                'A chef competing in an intergalactic cooking competition',
                'A time traveler trying to fix historical mistakes',
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="group p-5 text-left rounded-2xl border-2 border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-neutral-800 dark:hover:to-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-base text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow-lg transform hover:scale-[1.02]"
                >
                  <span className="group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">{example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CreateComic;

