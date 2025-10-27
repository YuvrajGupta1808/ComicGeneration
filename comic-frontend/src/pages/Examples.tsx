import { ArrowRight, BookOpen } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';

const Examples: React.FC = () => {
  const examples = [
    {
      title: "Sci-Fi Adventure",
      style: "Manga",
      description: "A futuristic story about space exploration",
      color: "from-indigo-100 to-purple-100",
      emoji: "🚀"
    },
    {
      title: "Superhero Battle",
      style: "Western Comic",
      description: "Epic battle between heroes and villains",
      color: "from-orange-100 to-red-100",
      emoji: "💥"
    },
    {
      title: "Fantasy Tale",
      style: "Watercolor",
      description: "A magical journey through enchanted lands",
      color: "from-pink-100 to-purple-100",
      emoji: "✨"
    },
    {
      title: "Mystery Detective",
      style: "Manga",
      description: "Solving crimes in the dark city",
      color: "from-gray-100 to-blue-100",
      emoji: "🕵️"
    },
    {
      title: "Action Hero",
      style: "Western Comic",
      description: "High-octane action and explosions",
      color: "from-yellow-100 to-orange-100",
      emoji: "🔥"
    },
    {
      title: "Romance Story",
      style: "Watercolor",
      description: "A heartwarming love story",
      color: "from-rose-100 to-pink-100",
      emoji: "💕"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/30 via-blue-100/40 to-indigo-100/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <AppNavbar />

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-gray-900 dark:text-white px-4 py-2 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800 mb-6">
            <span>Inspiration Gallery</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            See what's possible with<br />ComicGen AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-neutral-400 max-w-2xl mx-auto mb-12">
            Explore comics created by our community across different styles and genres
          </p>
        </div>

        {/* Examples Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examples.map((example, index) => (
            <Link key={index} to="/create" className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl transition-all group cursor-pointer">
              <div className={`aspect-[4/3] bg-gradient-to-br ${example.color} dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <div className="text-7xl">{example.emoji}</div>
              </div>
              <div className="p-6">
                <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-full text-xs font-semibold text-gray-700 dark:text-neutral-300 mb-3">
                  {example.style}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{example.title}</h3>
                <p className="text-gray-600 dark:text-neutral-400 text-sm leading-relaxed">{example.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Styles Showcase */}
      <div className="py-24 px-6 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">Choose your style</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Link to="/create" className="text-center group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <div className="text-8xl">📖</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manga</h3>
              <p className="text-gray-600 dark:text-neutral-400 text-sm">Japanese comic aesthetics</p>
            </Link>
            <Link to="/create" className="text-center group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <div className="text-8xl">💥</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Western Comic</h3>
              <p className="text-gray-600 dark:text-neutral-400 text-sm">Bold superhero style</p>
            </Link>
            <Link to="/create" className="text-center group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <div className="text-8xl">🎨</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Watercolor</h3>
              <p className="text-gray-600 dark:text-neutral-400 text-sm">Soft artistic storytelling</p>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Create your own comic
          </h2>
          <p className="text-lg text-gray-300 dark:text-neutral-400 mb-10">
            Start with any of these styles and make it yours
          </p>
          <Link 
            to="/create" 
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white dark:bg-white text-gray-900 dark:text-gray-900 text-base font-semibold rounded-full hover:bg-gray-100 dark:hover:bg-gray-100 transition-all"
          >
            <span>Get Started — It's free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">ComicGen AI</span>
            </Link>
            <div className="flex gap-8 text-sm text-gray-600 dark:text-neutral-400">
              <Link to="/pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link>
              <Link to="/examples" className="hover:text-gray-900 dark:hover:text-white">Examples</Link>
              <button onClick={() => window.location.href = 'mailto:support@comicgen.ai'} className="hover:text-gray-900 dark:hover:text-white">Contact</button>
            </div>
            <div className="text-gray-500 dark:text-neutral-500 text-sm">
              © 2025 ComicGen AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Examples;

