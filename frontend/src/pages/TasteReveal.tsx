import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buildProfile } from '../lib/api';

export default function TasteReveal() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const stored = sessionStorage.getItem('taste_selection');
      if (!stored) {
        navigate('/build-taste');
        return;
      }
      const movies = JSON.parse(stored);
      
      // Artificial delay for cinematic effect
      await new Promise(r => setTimeout(r, 2000));
      
      const res = await buildProfile(movies);
      setProfile(res);
      setAnalyzing(false);
      
      // Store profile in session
      sessionStorage.setItem('taste_profile', JSON.stringify(res.taste_profile));
    }
    load();
  }, [navigate]);

  if (analyzing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="w-64 h-64 rounded-full border-t border-indigo-500/50 absolute"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="w-48 h-48 rounded-full border-b border-purple-500/50 absolute"
        />
        <h2 className="text-3xl font-light tracking-widest text-indigo-200 animate-pulse z-10">ANALYZING TASTE...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950"></div>
      
      <div className="z-10 max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300 mb-4">
            WE'VE MAPPED YOUR TASTE.
          </h2>
          <p className="text-xl text-slate-300 font-light mb-2">Based on the movies you selected and how you rated them.</p>
          <p className="text-lg text-slate-500 mb-12">You're heavily drawn to...</p>
          
          <div className="space-y-6 mb-16 text-left max-w-md mx-auto">
            {profile?.taste_profile.map((g: any, i: number) => (
              <div key={g.genre} className="relative">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-slate-200 uppercase tracking-wider">{g.genre}</span>
                  <span className="text-indigo-400">{g.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${g.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-500"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-lg text-slate-300 font-medium mb-6">Ready to see what your Movie DNA unlocks?</p>
          
          <button 
            onClick={() => navigate('/recommendations')}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-base md:text-lg transition-all duration-300 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 mx-auto uppercase tracking-wide group"
          >
            <span>EXPLORE MY MOVIEVERSE</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
