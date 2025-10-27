import { Image, Palette, Sparkles, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/sections/Footer';

const CreateComic: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [artStyle, setArtStyle] = useState<'manga' | 'western' | 'watercolor'>('manga');
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const artStyles = [
    {
      id: 'manga' as const,
      name: 'Manga',
      emoji: '📖',
      description: 'Japanese comic aesthetics',
      gradient: 'from-indigo-100 to-purple-100',
    },
    {
      id: 'western' as const,
      name: 'Western Comic',
      emoji: '💥',
      description: 'Bold superhero style',
      gradient: 'from-orange-100 to-red-100',
    },
    {
      id: 'watercolor' as const,
      name: 'Watercolor',
      emoji: '🎨',
      description: 'Soft artistic storytelling',
      gradient: 'from-pink-100 to-purple-100',
    },
  ];

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setReferenceImages((prev) => [...prev, ...filesArray].slice(0, 4)); // Max 4 images
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt) {
      alert('Please enter a prompt for your comic');
      return;
    }

    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      // Navigate to results or show success
      console.log('Generated comic with:', { prompt, artStyle, referenceImages });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/30 via-blue-100/40 to-indigo-100/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex flex-col">
      <AppNavbar />
      
      <div className="flex-1 pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/90 dark:bg-neutral-900/60 backdrop-blur-sm text-gray-700 dark:text-white px-4 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-neutral-800 shadow-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Create Your Comic</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Bring your story to life
            </h1>
            <p className="text-lg text-gray-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Describe your comic scene and optionally add character and background references
            </p>
          </div>

          {/* Prompt Input */}
          <div className="mb-12">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Describe your comic scene
            </label>
            <div className="relative max-w-4xl mx-auto">
              <textarea
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Describe your comic scene... e.g., 'A superhero saving the city from a giant robot'"
                className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent resize-none text-base"
                rows={4}
              />
            </div>
          </div>

          {/* Art Style Selection */}
          <div className="mb-12">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">
              <Palette className="w-4 h-4 inline-block mr-2" />
              Choose your art style
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              {artStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setArtStyle(style.id)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    artStyle === style.id
                      ? 'border-indigo-500 dark:border-indigo-600 bg-white dark:bg-neutral-900 shadow-lg'
                      : 'border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 hover:border-gray-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className={`aspect-square bg-gradient-to-br ${style.gradient} dark:from-neutral-800 dark:to-neutral-700 rounded-xl flex items-center justify-center mb-4`}>
                    <div className="text-5xl">{style.emoji}</div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{style.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-neutral-400">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reference Images Upload */}
          <div className="mb-12">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">
              <Image className="w-4 h-4 inline-block mr-2" />
              Add character and background references (optional)
            </label>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-neutral-700 p-8">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {referenceImages.length === 0 ? (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 dark:text-neutral-600 mb-4" />
                  <p className="text-gray-600 dark:text-neutral-400 text-center mb-2">
                    Click to upload character and background reference images
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-500">
                    PNG, JPG up to 10MB (max 4 images)
                  </p>
                </label>
              ) : (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {referenceImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {referenceImages.length < 4 && (
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white rounded-full cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Add more images</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="inline-flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating your comic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Comic</span>
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-4">
              Generation typically takes 30-60 seconds
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CreateComic;

