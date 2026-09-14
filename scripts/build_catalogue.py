import pandas as pd
import json
import os

DATA_DIR = '.'
ARTIFACTS_DIR = 'ml/artifacts'
OUT_FILE = 'backend/catalogue.json'

print("Loading movies...")
movies = pd.read_csv(f'{DATA_DIR}/movies.dat', sep='::', engine='python', 
                     names=['MovieID', 'Title', 'Genres'], encoding='latin-1')

print("Loading stats...")
try:
    stats = pd.read_csv(f'{ARTIFACTS_DIR}/movie_stats.csv')
except FileNotFoundError:
    print("Run ML pipeline first to generate movie_stats.csv")
    exit(1)

# Merge
df = movies.merge(stats, on='MovieID', how='inner')

# Filter for movies with at least 50 ratings to have a high-quality catalogue
df = df[df['count'] >= 50]

# Sort by popularity (count) to ensure good movies surface first
df = df.sort_values('count', ascending=False)

# Extract year from title (e.g., "Toy Story (1995)")
df['Year'] = df['Title'].str.extract(r'\((\d{4})\)')
df['Title'] = df['Title'].str.replace(r'\(\d{4}\)', '', regex=True).str.strip()

# Format genres
df['Genres'] = df['Genres'].str.split('|')

# Convert to dict and save
catalogue = df[['MovieID', 'Title', 'Year', 'Genres', 'mean_rating', 'count', 'popularity_score']].to_dict(orient='records')

with open(OUT_FILE, 'w') as f:
    json.dump(catalogue, f, indent=2)

print(f"Saved {len(catalogue)} movies to {OUT_FILE}")
