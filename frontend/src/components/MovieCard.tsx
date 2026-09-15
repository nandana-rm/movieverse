import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Check, Star, Info } from 'lucide-react';
import { type Movie, getMovieTmdbInfo } from '../lib/api';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isSelected?: boolean;
  rating?: number;
  onRate?: (rating: number, e: React.MouseEvent) => void;
  showMatch?: boolean;
}

export default function MovieCard({ movie, onClick, isSelected, rating = 0, onRate, showMatch }: MovieCardProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMovieTmdbInfo(movie.MovieID).then(data => {
      if (mounted && data?.poster_path) {
        setPosterUrl(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
      }
    });
    return () => { mounted = false; };
  }, [movie.MovieID]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group transition-transform ${isSelected ? 'ring-4 ring-indigo-500 shadow-[0_0_30px_-5px_rgba(79,70,229,0.4)] scale-[0.98]' : 'hover:scale-[1.02] bg-slate-900'} flex flex-col h-full`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 text-center z-0">
        <Film className="w-12 h-12 text-slate-700 mb-4" />
        <h3 className="font-medium text-slate-300 leading-tight uppercase opacity-50">{movie.Title}</h3>
        <p className="text-sm text-slate-500 mt-2">{movie.Year}</p>
      </div>

      {posterUrl && (
        <img 
          src={posterUrl} 
          alt={movie.Title} 
          className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500" 
        />
      )}

      {/* Match Badge */}
      {showMatch && movie.match_score && (
        <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-indigo-600/90 backdrop-blur-md rounded-md text-xs font-bold text-white shadow-lg">
          {Number(movie.match_score).toFixed(1)}% MATCH
        </div>
      )}

      {/* Overlay */}
      <div className={`absolute inset-0 z-20 transition-colors ${isSelected ? 'bg-indigo-900/40' : 'bg-black/0 group-hover:bg-black/40'}`}>
        {isSelected && (
          <div className="absolute top-3 right-3 bg-indigo-500 rounded-full p-1 shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Persistent Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent flex flex-col justify-end min-h-[40%]">
        <h3 className="font-bold text-sm leading-tight text-white mb-1 line-clamp-2">{movie.Title}</h3>
        
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-slate-400">{movie.Year}</span>
          {movie.Genres && movie.Genres.length > 0 && (
            <>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 truncate">{movie.Genres.slice(0, 2).join(', ')}</span>
            </>
          )}
        </div>

        {showMatch && movie.match_score && (
          <div className="flex items-center gap-1 mt-1">
             <span className="text-[10px] sm:text-xs font-medium text-amber-400 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 shrink-0" /> Taste Match: {Number(movie.match_score).toFixed(1)}% (Cosine Sim)
             </span>
          </div>
        )}
        
        {showMatch && movie.explanation && (
          <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-1">{movie.explanation}</p>
        )}
      </div>

      {/* Rating UI for selected */}
      {isSelected && onRate && (
        <div className="absolute top-0 left-0 right-0 bottom-0 z-30 p-3 bg-indigo-950/80 backdrop-blur-sm flex flex-col items-center justify-center opacity-100 sm:opacity-0 sm:hover:opacity-100 transition-opacity">
          <p className="text-[10px] sm:text-xs font-bold text-indigo-200 mb-3 text-center uppercase tracking-wider bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/30">Rate this movie</p>
          <div className="flex justify-center gap-1 sm:gap-2 bg-slate-900/80 p-1.5 sm:p-2 rounded-full shadow-2xl">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star}
                onClick={(e) => onRate(star, e)}
                className={`w-5 h-5 sm:w-6 sm:h-6 cursor-pointer transition-transform hover:scale-110 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
