import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight, BarChart2 } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Cinematic Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">Research Methodology Final Project</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
            MOVIEVERSE
          </h1>
          
          <p className="text-2xl md:text-3xl font-light text-slate-400 mb-12 tracking-wide">
            Your taste. <span className="text-indigo-400 font-medium">Decoded.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/build-taste')}
              className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium text-lg transition-all duration-300 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10">Build My Movie DNA</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <button 
              onClick={() => navigate('/research')}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-lg transition-all duration-300 flex items-center gap-3 backdrop-blur-md"
            >
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>HOW IT WORKS →</span>
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Footer attribution */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-2 text-slate-600 text-sm">
        <div className="flex items-center gap-3">
            <img 
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
              alt="TMDB Logo" 
              className="h-3 w-auto opacity-40 grayscale"
            />
            <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
        <p className="mt-1">Trained on the MovieLens-1M dataset.</p>
      </div>
    </div>
  );
}
