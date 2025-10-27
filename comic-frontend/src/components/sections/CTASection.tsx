import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <div className="py-24 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden z-10">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2.5 rounded-full text-sm font-semibold border border-white/20">
            <Sparkles className="w-4 h-4" />
            <span>No credit card required</span>
          </div>
        </div>

        <h2 className="text-5xl font-bold text-white mb-6 tracking-tight">
          Ready to bring your<br />stories to life?
        </h2>
        <p className="text-[18px] text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Join thousands of creators worldwide making professional comics with AI. Start creating in under 5 minutes—completely free.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            to="/create" 
            className="inline-flex items-center justify-center space-x-2.5 px-8 py-4 bg-white text-gray-900 text-[16px] font-semibold rounded-full hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
          >
            <span>Get Started — It's free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/examples" 
            className="inline-flex items-center justify-center space-x-2.5 px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-[16px] font-semibold rounded-full hover:bg-white/20 transition-all border border-white/20 hover:border-white/30 transform hover:scale-[1.02]"
          >
            <span>View Examples</span>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Free forever plan</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>No watermarks</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Commercial use</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;
