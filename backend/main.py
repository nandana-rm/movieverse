import json
import pickle
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sklearn.metrics.pairwise import cosine_similarity
import math
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
TMDB_TOKEN = os.environ.get("TMDB_READ_ACCESS_TOKEN", "")

app = FastAPI(title="MovieVerse API")

@app.get("/health")
def health_check():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data on startup
with open("backend/catalogue.json", "r") as f:
    catalogue = json.load(f)

# MovieID to dict mapping
movie_dict = {m['MovieID']: m for m in catalogue}

with open("ml/artifacts/model_results.json", "r") as f:
    model_results = json.load(f)

with open("ml/artifacts/tfidf_vectorizer.pkl", "rb") as f:
    tfidf = pickle.load(f)

with open("ml/artifacts/tfidf_matrix.pkl", "rb") as f:
    tfidf_matrix = pickle.load(f)

# Create a mapping from MovieID to tfidf matrix row index
import pandas as pd
movies_raw = pd.read_csv('movies.dat', sep='::', engine='python', names=['MovieID', 'Title', 'Genres'], encoding='latin-1')
movie_id_to_idx = {row['MovieID']: idx for idx, row in movies_raw.iterrows()}
idx_to_movie_id = {idx: row['MovieID'] for idx, row in movies_raw.iterrows()}

TMDB_API_KEY = "YOUR_TMDB_API_KEY" # Placeholder

class MovieInput(BaseModel):
    movie_id: int
    rating: Optional[float] = 5.0

class ProfileRequest(BaseModel):
    movies: List[MovieInput]
    
class RecommendRequest(BaseModel):
    movies: List[MovieInput]
    top_k: int = 10

@app.get("/api/movies")
def get_movies(page: int = 1, limit: int = 50, search: str = None, category: str = None):
    # category can be 'popular', 'recent', etc.
    filtered = catalogue
    if search:
        search = search.lower()
        filtered = [m for m in filtered if search in m['Title'].lower()]
        
    if category == 'popular':
        filtered = sorted(filtered, key=lambda x: x['count'], reverse=True)
    elif category == 'highly_rated':
        # only consider those with substantial ratings
        filtered = sorted(filtered, key=lambda x: x['mean_rating'], reverse=True)
    elif category == 'recent':
        filtered = sorted(filtered, key=lambda x: int(x['Year']) if isinstance(x['Year'], str) and x['Year'].isdigit() else 0, reverse=True)
        
    start = (page - 1) * limit
    end = start + limit
    return {
        "total": len(filtered),
        "page": page,
        "limit": limit,
        "movies": filtered[start:end]
    }

@app.get("/api/movies/{movie_id}")
async def get_movie(movie_id: int):
    if movie_id not in movie_dict:
        raise HTTPException(status_code=404, detail="Movie not found")
    movie = movie_dict[movie_id].copy()
    return movie

tmdb_cache = {}

@app.get("/api/movies/{movie_id}/tmdb")
async def get_tmdb_info(movie_id: int):
    if movie_id not in movie_dict:
        raise HTTPException(status_code=404, detail="Movie not found")
        
    if movie_id in tmdb_cache:
        return tmdb_cache[movie_id]
        
    movie = movie_dict[movie_id]
    title = movie['Title']
    year = str(movie['Year'])
    
    if not TMDB_TOKEN:
        return {"poster_path": None, "backdrop_path": None, "overview": None}
        
    headers = {
        "Authorization": f"Bearer {TMDB_TOKEN}",
        "accept": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            # Search movie
            res = await client.get(
                "https://api.themoviedb.org/3/search/movie",
                params={"query": title, "year": year, "language": "en-US", "page": 1},
                headers=headers,
                timeout=5.0
            )
            if res.status_code == 200:
                data = res.json()
                if data.get("results") and len(data["results"]) > 0:
                    best_match = data["results"][0]
                    result = {
                        "poster_path": best_match.get("poster_path"),
                        "backdrop_path": best_match.get("backdrop_path"),
                        "overview": best_match.get("overview")
                    }
                    tmdb_cache[movie_id] = result
                    return result
    except httpx.RequestError:
        pass
                
    # Fallback
    fallback = {"poster_path": None, "backdrop_path": None, "overview": None}
    tmdb_cache[movie_id] = fallback
    return fallback

@app.post("/api/profile/build")
def build_profile(req: ProfileRequest):
    # Compute taste profile
    genres = {}
    total_weight = 0
    for m in req.movies:
        if m.movie_id in movie_dict:
            weight = m.rating if m.rating else 5.0
            total_weight += weight
            for g in movie_dict[m.movie_id]['Genres']:
                genres[g] = genres.get(g, 0) + weight
                
    # Normalize
    profile = []
    if total_weight > 0:
        profile = [{"genre": k, "percentage": int((v / total_weight) * 100)} for k, v in genres.items()]
        profile = sorted(profile, key=lambda x: x['percentage'], reverse=True)[:5]
        
    return {
        "taste_profile": profile,
        "selected_movies": [movie_dict[m.movie_id] for m in req.movies if m.movie_id in movie_dict]
    }

@app.post("/api/recommend")
def recommend(req: RecommendRequest):
    if not req.movies:
        return {"recommendations": []}
        
    # Build user vector
    user_vector = np.zeros((1, tfidf_matrix.shape[1]))
    user_rated_ids = set()
    
    for m in req.movies:
        user_rated_ids.add(m.movie_id)
        if m.movie_id in movie_id_to_idx:
            idx = movie_id_to_idx[m.movie_id]
            weight = m.rating if m.rating else 5.0
            # Only consider positive signals (rating >= 3)
            if weight >= 3.0:
                user_vector += tfidf_matrix[idx] * (weight - 2.5)
                
    if np.sum(user_vector) == 0:
        # Fallback to popularity
        recs = [m for m in catalogue if m['MovieID'] not in user_rated_ids][:req.top_k]
        return {"recommendations": recs, "model": "Popularity Baseline (Fallback)"}
        
    # Compute similarity
    sims = cosine_similarity(np.asarray(user_vector), tfidf_matrix).flatten()
    
    # Tie-breaking sort using popularity
    scored_items = []
    for idx in range(len(sims)):
        m_id = idx_to_movie_id.get(idx)
        if m_id and m_id not in user_rated_ids and m_id in movie_dict:
            pop = movie_dict[m_id].get('popularity_score', 0)
            scored_items.append((sims[idx], pop, idx))
            
    scored_items.sort(key=lambda x: (x[0], x[1]), reverse=True)
    
    # Identify primary genre
    genres_count = {}
    for m in req.movies:
        if m.movie_id in movie_dict:
            weight = m.rating if m.rating else 5.0
            if weight >= 3.0:
                for g in movie_dict[m.movie_id]['Genres']:
                    genres_count[g] = genres_count.get(g, 0) + weight
    top_genres = sorted(genres_count.items(), key=lambda x: x[1], reverse=True)
    primary_genre = top_genres[0][0] if top_genres else None

    best_matches = []
    top_genre_matches = []
    something_different = []
    
    for sim, pop, idx in scored_items:
        m_id = idx_to_movie_id[idx]
        movie = movie_dict[m_id].copy()
        
        movie['match_score'] = round(float(sim) * 100, 1)
        
        if primary_genre and primary_genre in movie['Genres']:
            movie['explanation'] = f"Strong overlap with your preference for {primary_genre}."
        else:
            movie['explanation'] = "Matches your broader taste profile."
            
        if len(best_matches) < req.top_k:
            best_matches.append(movie)
        elif primary_genre and primary_genre in movie['Genres'] and len(top_genre_matches) < 10:
            top_genre_matches.append(movie)
        elif primary_genre and not any(g in movie['Genres'] for g in [tg[0] for tg in top_genres[:3]]) and sim >= 0.1 and len(something_different) < 10:
            movie['explanation'] = "Stretches beyond your usual preferences."
            something_different.append(movie)
            
        if len(best_matches) == req.top_k and len(top_genre_matches) == 10 and len(something_different) == 10:
            break
            
    return {
        "recommendations": best_matches, # Fallback for current UI
        "best_matches": best_matches,
        "top_genre_matches": top_genre_matches,
        "something_different": something_different,
        "model": "Content-Based (Cold-Start)"
    }

@app.get("/api/model-results")
def get_model_results():
    return model_results

@app.get("/api/research-summary")
def get_research_summary():
    return {
        "methodology": "Data \u2192 Cleaning \u2192 Feature Engineering \u2192 Train/Validation/Test \u2192 Models \u2192 Evaluation \u2192 Best Model \u2192 Recommendations",
        "dataset": "MovieLens 1M",
        "limitations": [
            "MovieLens represents its particular user population and may not generalize to all audiences.",
            "Cold-start users require enough initial preferences.",
            "Historical ratings can contain popularity bias.",
            "TMDB presentation metadata is separate from the ML training data.",
            "A recommendation is not a guarantee that a user will enjoy a movie."
        ]
    }
