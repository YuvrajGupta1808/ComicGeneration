import { BookOpen } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-6 border-t border-gray-300/50 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">ComicGen AI</span>
          </Link>
          <div className="flex gap-8 text-sm text-gray-600 dark:text-neutral-400 font-medium">
            <Link to="/examples" className="hover:text-gray-900 dark:hover:text-white transition-colors">Examples</Link>
            <Link to="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</Link>
            <button onClick={() => window.location.href = 'mailto:support@comicgen.ai'} className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</button>
          </div>
          <div className="text-gray-500 dark:text-neutral-500 text-sm">
            © 2025 ComicGen AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
