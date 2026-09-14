import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Film, Target, HelpCircle } from 'lucide-react';
import { type Movie, getMovieTmdbInfo } from '../lib/api';

export default function MovieDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const movie: Movie = state?.movie;
  
  const [tmdbData, setTmdbData] = useState<any>(null);

  useEffect(() => {
    if (movie?.MovieID) {
      getMovieTmdbInfo(movie.MovieID).then(setTmdbData);
    }
  }, [movie]);

  if (!movie) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <p className="text-white">Movie not found.</p>
        <button onClick={() => navigate('/recommendations')} className="mt-4 text-indigo-400">Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900 z-0 h-[60vh] overflow-hidden">
        {tmdbData?.backdrop_path ? (
           <img src={`https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`} alt="backdrop" className="absolute inset-0 w-full h-full object-cover opacity-30 object-top" />
        ) : (
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent z-10"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-10"></div>
      </div>

      {/* Nav */}
      <nav className="relative z-20 p-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      {/* Content */}
      <main className="relative z-20 max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-12 gap-12 items-start">
        {/* Poster */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-4 lg:col-span-3"
        >
          <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center border border-white/10 shadow-2xl relative overflow-hidden">
            {tmdbData?.poster_path ? (
               <img src={`https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`} alt="poster" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <>
                    <Film className="w-20 h-20 text-slate-700/50 mb-6" />
                    <h3 className="font-bold text-slate-600 text-3xl uppercase opacity-20">{movie.Title}</h3>
                </>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-8 lg:col-span-9"
        >
          <div className="mb-4 flex items-center gap-4">
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-slate-300 border border-white/5 backdrop-blur-md">
              {movie.Year}
            </span>
            <span className="text-sm font-medium text-slate-400 tracking-wider uppercase">
              {movie.Genres.join(' • ')}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">{movie.Title}</h1>
          
          {tmdbData?.overview && (
             <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-3xl">{tmdbData.overview}</p>
          )}

          <div className="flex flex-wrap gap-6 mb-12">
            {movie.match_score && (
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Taste Match</span>
                <div className="flex items-center gap-2 text-2xl font-bold text-emerald-400">
                  <Target className="w-6 h-6" />
                  {movie.match_score}%
                </div>
              </div>
            )}
            
            <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Community Rating</span>
                <div className="flex items-center gap-2 text-2xl font-bold text-slate-300">
                  {movie.mean_rating.toFixed(1)} <span className="text-slate-500 text-lg text-sm">({movie.count} reviews)</span>
                </div>
            </div>
          </div>

          {movie.explanation && (
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-indigo-300 uppercase tracking-wider text-sm">Why we think you'll like this</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-lg">
                {movie.explanation}
              </p>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
