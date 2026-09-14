import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import { searchMovies, getBrowseMovies, type Movie } from '../lib/api';
import MovieCard from '../components/MovieCard';
import MiniSelectedMovie from '../components/MiniSelectedMovie';

const GENRES = [
  "All", "Action", "Adventure", "Animation", "Children", "Comedy", 
  "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Musical", 
  "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western"
];

const MAJOR_GENRES = ["Action", "Comedy", "Drama", "Sci-Fi", "Romance", "Thriller", "Animation"];

// Simple debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function TasteBuilder() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  const [selectedMovies, setSelectedMovies] = useState<Map<number, { rating: number, title: string }>>(() => {
    const saved = sessionStorage.getItem('taste_selection');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const initialMap = new Map();
        parsed.forEach((item: any) => {
          initialMap.set(item.movie_id, { rating: item.rating, title: item.title || "Movie" });
        });
        return initialMap;
      } catch (e) {
        console.error(e);
      }
    }
    return new Map();
  });

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      if (debouncedQuery.trim() === '') {
        // Fetch a large batch for local filtering when browsing
        const browse = await getBrowseMovies(600);
        setMovies(browse);
      } else {
        const res = await searchMovies(debouncedQuery);
        setMovies(res);
      }
      setLoading(false);
    }
    fetchMovies();
  }, [debouncedQuery]);

  const toggleMovie = (movie: Movie) => {
    setSelectedMovies(prev => {
      const next = new Map(prev);
      if (next.has(movie.MovieID)) {
        next.delete(movie.MovieID);
      } else {
        next.set(movie.MovieID, { rating: 5, title: movie.Title });
      }
      return next;
    });
  };

  const updateRating = (id: number, rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMovies(prev => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, rating });
      }
      return next;
    });
  };

  const removeMovie = (id: number) => {
    setSelectedMovies(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBuildTaste = () => {
    if (selectedMovies.size < 5) return;
    const selection = Array.from(selectedMovies.entries()).map(([id, data]) => ({ movie_id: id, rating: data.rating, title: data.title }));
    sessionStorage.setItem('taste_selection', JSON.stringify(selection));
    navigate('/taste-reveal');
  };

  // Filtered state
  const isBrowsingAll = debouncedQuery.trim() === '' && selectedGenre === 'All';
  
  const displayMovies = useMemo(() => {
    if (selectedGenre === 'All') return movies;
    return movies.filter(m => m.Genres.includes(selectedGenre));
  }, [movies, selectedGenre]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 pt-6 pb-4 flex flex-col items-center text-center gap-6">
        <div className="px-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300 mb-2 tracking-tight">
            BUILD YOUR MOVIE DNA
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            Pick a few movies you've watched and loved. We'll figure out the rest.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full max-w-2xl px-6">
          <div className="absolute inset-y-0 left-6 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-xl"
            placeholder="Search for movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Genre Pills */}
        <div className="w-full overflow-x-auto no-scrollbar border-t border-white/5 mt-2">
          <div className="flex items-center gap-2 px-6 py-4 w-max mx-auto">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedGenre === genre 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full pt-8">
        
        {loading ? (
          <div className="flex items-center justify-center pt-20">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="w-full">
            {isBrowsingAll ? (
              // ALL RAILS VIEW
              <div className="flex flex-col gap-10">
                
                {/* Popular Picks Rail */}
                <MovieRail title="Popular Picks" movies={movies.slice(0, 15)} selectedMovies={selectedMovies} toggleMovie={toggleMovie} updateRating={updateRating} />

                {/* Major Genre Rails */}
                {MAJOR_GENRES.map(genre => {
                  const genreMovies = movies.filter(m => m.Genres.includes(genre)).slice(0, 15);
                  if (genreMovies.length < 5) return null;
                  return (
                    <MovieRail 
                      key={genre} 
                      title={genre} 
                      movies={genreMovies} 
                      selectedMovies={selectedMovies} 
                      toggleMovie={toggleMovie} 
                      updateRating={updateRating} 
                    />
                  );
                })}
              </div>
            ) : (
              // FILTERED/SEARCH GRID VIEW
              <div className="px-6 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                    {debouncedQuery ? `SEARCH: ${debouncedQuery}` : selectedGenre}
                  </h2>
                  <span className="text-sm text-slate-500 font-medium bg-slate-900 px-2 py-0.5 rounded-md">{displayMovies.length}</span>
                </div>
                
                {displayMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    <AnimatePresence>
                      {displayMovies.map((movie) => {
                        const isSelected = selectedMovies.has(movie.MovieID);
                        const rating = selectedMovies.get(movie.MovieID)?.rating || 0;
                        return (
                          <MovieCard 
                            key={movie.MovieID} 
                            movie={movie} 
                            isSelected={isSelected} 
                            rating={rating} 
                            onClick={() => toggleMovie(movie)}
                            onRate={(r, e) => updateRating(movie.MovieID, r, e)}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/50 rounded-2xl border border-white/5">
                    <Search className="w-12 h-12 text-slate-700 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No movies found.</h3>
                    <p className="text-slate-500 mt-1">Try another title or genre.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Selected Tray */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
        <div className="max-w-5xl mx-auto bg-slate-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-6 pointer-events-auto">
          
          <div className="flex items-center justify-between w-full md:w-auto md:min-w-[140px]">
             <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Movie DNA</p>
                <p className="text-2xl font-black text-white">{Math.min(selectedMovies.size, 5)} <span className="text-slate-500 text-lg">/ 5{selectedMovies.size >= 5 ? '+' : ''}</span></p>
             </div>
          </div>
          
          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar w-full py-1">
            <AnimatePresence>
              {Array.from(selectedMovies.entries()).map(([id, data]) => (
                <MiniSelectedMovie 
                  key={id} 
                  movieId={id} 
                  title={data.title} 
                  onRemove={() => removeMovie(id)} 
                />
              ))}
            </AnimatePresence>
            {selectedMovies.size === 0 && (
              <p className="text-slate-500 text-sm italic">Choose movies to build your profile...</p>
            )}
          </div>

          <button 
            onClick={handleBuildTaste}
            disabled={selectedMovies.size < 5}
            className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-600/20 disabled:shadow-none flex items-center justify-center gap-2 group"
          >
            BUILD MY TASTE
            <ChevronRight className={`w-5 h-5 ${selectedMovies.size >= 5 ? 'group-hover:translate-x-1 transition-transform' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Component for Rails
function MovieRail({ title, movies, selectedMovies, toggleMovie, updateRating }: { 
  title: string, 
  movies: Movie[], 
  selectedMovies: Map<number, { rating: number, title: string }>,
  toggleMovie: (movie: Movie) => void,
  updateRating: (id: number, rating: number, e: React.MouseEvent) => void
}) {
  return (
    <div className="w-full">
      <div className="px-6 max-w-[1600px] mx-auto flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </div>
      <div className="w-full overflow-x-auto no-scrollbar pb-4 scroll-smooth snap-x">
        <div className="flex gap-4 md:gap-6 px-6 max-w-[1600px] mx-auto w-max">
          {movies.map(movie => {
            const isSelected = selectedMovies.has(movie.MovieID);
            const rating = selectedMovies.get(movie.MovieID)?.rating || 0;
            return (
              <div key={movie.MovieID} className="w-[140px] md:w-[180px] lg:w-[200px] snap-start shrink-0">
                <MovieCard 
                  movie={movie} 
                  isSelected={isSelected} 
                  rating={rating} 
                  onClick={() => toggleMovie(movie)}
                  onRate={(r, e) => updateRating(movie.MovieID, r, e)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
