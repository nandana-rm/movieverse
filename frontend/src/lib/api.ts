const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface Movie {
  MovieID: number;
  Title: string;
  Year: string;
  Genres: string[];
  mean_rating: number;
  count: number;
  popularity_score: number;
  match_score?: number;
  predicted_rating?: number;
  explanation?: string;
  poster_path?: string; // We'll add this dynamically
  backdrop_path?: string;
}

export const searchMovies = async (query: string): Promise<Movie[]> => {
  const res = await fetch(`${API_URL}/movies?limit=20&search=${query}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.movies;
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const res = await fetch(`${API_URL}/movies?limit=50&category=popular`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.movies;
};

export const getBrowseMovies = async (limit: number = 600): Promise<Movie[]> => {
  const res = await fetch(`${API_URL}/movies?limit=${limit}&category=popular`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.movies;
};

export const buildProfile = async (movies: { movie_id: number; rating: number }[]) => {
  const res = await fetch(`${API_URL}/profile/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movies })
  });
  return res.json();
};

export const getRecommendations = async (movies: { movie_id: number; rating: number }[]) => {
  const res = await fetch(`${API_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movies, top_k: 20 })
  });
  return res.json();
};

export const getMovieTmdbInfo = async (movieId: number) => {
  const res = await fetch(`${API_URL}/movies/${movieId}/tmdb`);
  if (!res.ok) return null;
  return res.json();
};

export const getResearchSummary = async () => {
  const res = await fetch(`${API_URL}/research-summary`);
  return res.json();
};

export const getModelResults = async () => {
  const res = await fetch(`${API_URL}/model-results`);
  return res.json();
};
