import React, { useState, useEffect } from 'react';
import { getMovieTmdbInfo } from '../lib/api';
import { X, Film } from 'lucide-react';
import { motion } from 'framer-motion';

interface MiniSelectedMovieProps {
  movieId: number;
  title: string;
  onRemove: () => void;
}

export default function MiniSelectedMovie({ movieId, title, onRemove }: MiniSelectedMovieProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMovieTmdbInfo(movieId).then(data => {
      if (mounted && data?.poster_path) {
        setPosterUrl(`https://image.tmdb.org/t/p/w200${data.poster_path}`);
      }
    });
    return () => { mounted = false; };
  }, [movieId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative w-12 h-16 md:w-16 md:h-24 rounded-md overflow-hidden shrink-0 group border border-white/10 shadow-md bg-slate-900"
      title={title}
    >
      {posterUrl ? (
        <img 
          src={posterUrl} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-slate-800">
          <Film className="w-4 h-4 md:w-6 md:h-6 text-slate-600" />
        </div>
      )}
      
      {/* Remove Overlay */}
      <div 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
      >
        <div className="bg-red-500 rounded-full p-1 shadow-lg">
          <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
