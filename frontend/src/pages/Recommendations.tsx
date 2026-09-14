import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecommendations, type Movie } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function Recommendations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const stored = sessionStorage.getItem('taste_selection');
      if (!stored) {
        navigate('/build-taste');
        return;
      }
      const movies = JSON.parse(stored);
      const res = await getRecommendations(movies);
      setData(res);
      setLoading(false);
    }
    load();
  }, [navigate]);

  const handleStartOver = () => {
    sessionStorage.removeItem('taste_selection');
    sessionStorage.removeItem('taste_profile');
    navigate('/build-taste');
  };

  const renderRail = (title: string, subtitle: string, movies: Movie[]) => {
    if (!movies || movies.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex items-end justify-between mb-4 px-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </h2>
            <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
          </div>
        </div>
        
        {/* Horizontal scroll rail */}
        <div className="flex overflow-x-auto gap-4 pb-6 px-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {movies.map((movie) => (
            <div key={movie.MovieID} className="min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] flex-shrink-0 snap-start h-[360px]">
              <MovieCard 
                movie={movie} 
                showMatch={true}
                onClick={() => navigate(`/movie/${movie.MovieID}`, { state: { movie } })}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/build-taste')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm tracking-widest uppercase">Refine My Taste</span>
          </button>
        </div>
        <button 
          onClick={() => navigate('/research')}
          className="text-sm font-bold tracking-widest text-slate-400 hover:text-white transition-colors uppercase"
        >
          How It Works →
        </button>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-hidden">
        {loading ? (
          <div className="flex-1 h-full min-h-[50vh] flex items-center justify-center">
             <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="pt-6">
            <div className="mb-12 px-2">
              <h1 className="text-4xl font-bold text-white mb-2">YOUR MOVIEVERSE</h1>
              <p className="text-indigo-400 text-lg font-medium">Picked for you based on your Movie DNA</p>
              <p className="text-slate-500 text-xs mt-1">New-user recommendations powered by content-based similarity.</p>
            </div>

            {renderRail("Best Matches", "Our top picks tailored to your exact taste profile.", data?.best_matches)}
            {renderRail("Based on Your Top Genres", "Exploring deeper into your favorite categories.", data?.top_genre_matches)}
            {renderRail("Something Different", "Relevant picks outside your dominant genres.", data?.something_different)}
            
            {/* Final Recommendations Section */}
            <div className="mt-24 mb-16 px-2 text-center border-t border-white/5 pt-16">
              <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Want to explore again?</h2>
              <p className="text-slate-400 mb-8">Your Movie DNA isn't fixed.</p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button 
                  onClick={() => navigate('/build-taste')}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold uppercase tracking-wide transition-colors"
                >
                  ← Refine My Taste
                </button>
                <button 
                  onClick={() => setShowRestartConfirm(true)}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-bold uppercase tracking-wide transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Start Over Dialog */}
      <AnimatePresence>
        {showRestartConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowRestartConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl z-10"
            >
              <h3 className="text-xl font-bold text-white mb-2">Start over?</h3>
              <p className="text-slate-400 mb-6">This will clear your current movie selections and taste profile.</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowRestartConfirm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleStartOver}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Start Over
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
}
