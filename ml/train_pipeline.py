import pandas as pd
import numpy as np
import os
import json
import pickle
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from surprise import Dataset, Reader, SVD, KNNBasic
from surprise import accuracy as surprise_accuracy
from sklearn.metrics import mean_squared_error, mean_absolute_error
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = '.'
ARTIFACTS_DIR = 'ml/artifacts'
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

print("Loading dataset...")
# Load movies
movies = pd.read_csv(f'{DATA_DIR}/movies.dat', sep='::', engine='python', 
                     names=['MovieID', 'Title', 'Genres'], encoding='latin-1')
# Load ratings
ratings = pd.read_csv(f'{DATA_DIR}/ratings.dat', sep='::', engine='python',
                      names=['UserID', 'MovieID', 'Rating', 'Timestamp'])

print(f"Total ratings: {len(ratings)}")
print(f"Total movies: {len(movies)}")
print(f"Total users: {ratings['UserID'].nunique()}")

# Sort chronologically for splitting
ratings = ratings.sort_values('Timestamp')

# Split 80/10/10 chronologically
n = len(ratings)
train_end = int(n * 0.8)
val_end = int(n * 0.9)

train_ratings = ratings.iloc[:train_end]
val_ratings = ratings.iloc[train_end:val_end]
test_ratings = ratings.iloc[val_end:]

print(f"Train size: {len(train_ratings)}, Val size: {len(val_ratings)}, Test size: {len(test_ratings)}")

# Helper to compute top-K metrics
def get_top_k(predictions, k=10):
    # Returns top K predictions for each user
    top_n = defaultdict(list)
    for uid, iid, true_r, est, _ in predictions:
        top_n[uid].append((iid, est))
    for uid, user_ratings in top_n.items():
        user_ratings.sort(key=lambda x: x[1], reverse=True)
        top_n[uid] = user_ratings[:k]
    return top_n

def compute_ranking_metrics(predictions, test_data, k=10, threshold=3.5):
    # predictions: list of (uid, iid, r_ui, est, details)
    # test_data: pandas df with UserID, MovieID, Rating
    
    top_k = get_top_k(predictions, k)
    
    precisions = dict()
    recalls = dict()
    ndcgs = dict()
    
    # Ground truth
    user_true_items = defaultdict(set)
    user_true_ratings = defaultdict(dict)
    for _, row in test_data.iterrows():
        if row['Rating'] >= threshold:
            user_true_items[row['UserID']].add(row['MovieID'])
        user_true_ratings[row['UserID']][row['MovieID']] = row['Rating']
        
    for uid, user_ratings in top_k.items():
        if uid not in user_true_items or len(user_true_items[uid]) == 0:
            continue
            
        n_rel = len(user_true_items[uid])
        n_rec_k = len(user_ratings)
        n_rel_and_rec_k = sum((iid in user_true_items[uid]) for (iid, _) in user_ratings)
        
        precisions[uid] = n_rel_and_rec_k / n_rec_k if n_rec_k != 0 else 0
        recalls[uid] = n_rel_and_rec_k / n_rel if n_rel != 0 else 0
        
        # NDCG calculation
        dcg = 0
        idcg = 0
        for i, (iid, _) in enumerate(user_ratings):
            if iid in user_true_ratings[uid] and user_true_ratings[uid][iid] >= threshold:
                rel = 1 # binary relevance
                dcg += rel / np.log2(i + 2)
        
        # Ideal DCG
        ideal_n = min(k, n_rel)
        for i in range(ideal_n):
            idcg += 1 / np.log2(i + 2)
            
        ndcgs[uid] = dcg / idcg if idcg > 0 else 0

    return (
        np.mean(list(precisions.values())),
        np.mean(list(recalls.values())),
        np.mean(list(ndcgs.values()))
    )

print("--- MODEL 0: POPULARITY BASELINE ---")
movie_stats = train_ratings.groupby('MovieID').agg(
    mean_rating=('Rating', 'mean'),
    count=('Rating', 'count')
).reset_index()

global_mean = train_ratings['Rating'].mean()
movie_stats['popularity_score'] = (movie_stats['count'] * movie_stats['mean_rating'] + 10 * global_mean) / (movie_stats['count'] + 10)

def predict_popularity(test_df):
    preds = test_df.merge(movie_stats[['MovieID', 'popularity_score']], on='MovieID', how='left')
    preds['popularity_score'] = preds['popularity_score'].fillna(global_mean)
    
    rmse = np.sqrt(mean_squared_error(preds['Rating'], preds['popularity_score']))
    mae = mean_absolute_error(preds['Rating'], preds['popularity_score'])
    
    # Format for ranking metrics: (uid, iid, true_r, est, None)
    surprise_preds = []
    for _, row in preds.iterrows():
        surprise_preds.append((row['UserID'], row['MovieID'], row['Rating'], row['popularity_score'], None))
        
    return rmse, mae, surprise_preds

pop_rmse, pop_mae, pop_preds = predict_popularity(val_ratings)
pop_p, pop_r, pop_ndcg = compute_ranking_metrics(pop_preds, val_ratings)

print(f"Popularity Baseline -> RMSE: {pop_rmse:.4f}, MAE: {pop_mae:.4f}, P@10: {pop_p:.4f}, R@10: {pop_r:.4f}, NDCG@10: {pop_ndcg:.4f}")

print("--- MODEL 1: CONTENT-BASED ---")
# TF-IDF on genres
movies['Genres_str'] = movies['Genres'].str.replace('|', ' ')
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(movies['Genres_str'])

# Map movie_id to index
movie_id_to_idx = {row['MovieID']: idx for idx, row in movies.iterrows()}

# To predict rating for user u on item i based on content:
# Find user's rated items, compute weighted average of their ratings based on cosine similarity with target item i.
# This is slow to run on all validation items, we'll approximate/skip full rating prediction for CB and rely on Collaborative for Rating prediction, but let's implement a fast heuristic.

# Instead of evaluating Content-based on RMSE which takes too long in python without optimization, 
# we'll build it specifically for the cold-start recommendation in the app, 
# and use Collaborative filtering as the main ML model.
# Let's save the tfidf_matrix for frontend use.
with open(f'{ARTIFACTS_DIR}/tfidf_vectorizer.pkl', 'wb') as f:
    pickle.dump(tfidf, f)
with open(f'{ARTIFACTS_DIR}/tfidf_matrix.pkl', 'wb') as f:
    pickle.dump(tfidf_matrix, f)

print("Content-based model prepared for cold-start (TF-IDF saved).")

print("--- SURPRISE DATA PREPARATION ---")
reader = Reader(rating_scale=(1, 5))
train_data = Dataset.load_from_df(train_ratings[['UserID', 'MovieID', 'Rating']], reader)
trainset = train_data.build_full_trainset()
val_data = list(val_ratings[['UserID', 'MovieID', 'Rating']].itertuples(index=False, name=None))

print("--- MODEL 2: ITEM-BASED KNN ---")
knn = KNNBasic(sim_options={'name': 'cosine', 'user_based': False})
knn.fit(trainset)
knn_preds = knn.test(val_data)
knn_rmse = surprise_accuracy.rmse(knn_preds, verbose=False)
knn_mae = surprise_accuracy.mae(knn_preds, verbose=False)
knn_p, knn_r, knn_ndcg = compute_ranking_metrics(knn_preds, val_ratings)
print(f"Item-Based KNN -> RMSE: {knn_rmse:.4f}, MAE: {knn_mae:.4f}, P@10: {knn_p:.4f}, R@10: {knn_r:.4f}, NDCG@10: {knn_ndcg:.4f}")

print("--- MODEL 3: COLLABORATIVE FILTERING (SVD) ---")
svd = SVD(n_factors=50, random_state=42)
svd.fit(trainset)

svd_preds = svd.test(val_data)

svd_rmse = surprise_accuracy.rmse(svd_preds, verbose=False)
svd_mae = surprise_accuracy.mae(svd_preds, verbose=False)
svd_p, svd_r, svd_ndcg = compute_ranking_metrics(svd_preds, val_ratings)

print(f"Collaborative SVD -> RMSE: {svd_rmse:.4f}, MAE: {svd_mae:.4f}, P@10: {svd_p:.4f}, R@10: {svd_r:.4f}, NDCG@10: {svd_ndcg:.4f}")

# Model Selection
print("--- MODEL SELECTION ---")
metrics = {
    "Baseline": {
        "MAE": pop_mae,
        "RMSE": pop_rmse,
        "Precision@10": pop_p,
        "Recall@10": pop_r,
        "NDCG@10": pop_ndcg
    },
    "Item-Based KNN": {
        "MAE": knn_mae,
        "RMSE": knn_rmse,
        "Precision@10": knn_p,
        "Recall@10": knn_r,
        "NDCG@10": knn_ndcg
    },
    "Content-Based": {
        "MAE": "N/A",
        "RMSE": "N/A",
        "Precision@10": "N/A",
        "Recall@10": "N/A",
        "NDCG@10": "N/A",
        "Note": "Used for cold-start only"
    },
    "Collaborative (SVD)": {
        "MAE": svd_mae,
        "RMSE": svd_rmse,
        "Precision@10": svd_p,
        "Recall@10": svd_r,
        "NDCG@10": svd_ndcg
    }
}

best_ndcg = max(pop_ndcg, knn_ndcg, svd_ndcg)
if best_ndcg == svd_ndcg:
    best_model_name = "Collaborative (SVD)"
    best_model_obj = svd
elif best_ndcg == knn_ndcg:
    best_model_name = "Item-Based KNN"
    best_model_obj = knn
else:
    best_model_name = "Baseline"
    best_model_obj = None

print(f"Selected Best Model: {best_model_name} (based on NDCG@10)")

if best_model_obj is not None:
    # Evaluate on test set
    test_data = list(test_ratings[['UserID', 'MovieID', 'Rating']].itertuples(index=False, name=None))
    test_preds = best_model_obj.test(test_data)
    test_rmse = surprise_accuracy.rmse(test_preds, verbose=False)
    test_mae = surprise_accuracy.mae(test_preds, verbose=False)
    test_p, test_r, test_ndcg = compute_ranking_metrics(test_preds, test_ratings)
    
    test_metrics = {
        "MAE": test_mae,
        "RMSE": test_rmse,
        "Precision@10": test_p,
        "Recall@10": test_r,
        "NDCG@10": test_ndcg
    }
    
    # Save best model
    with open(f'{ARTIFACTS_DIR}/best_model.pkl', 'wb') as f:
        pickle.dump(best_model_obj, f)
else:
    test_metrics = {} # Popularity doesn't need to be saved as a model, just movie_stats
    
# Save movie stats for popularity fallback
movie_stats.to_csv(f'{ARTIFACTS_DIR}/movie_stats.csv', index=False)

results = {
    "dataset_stats": {
        "total_ratings": len(ratings),
        "total_movies": len(movies),
        "total_users": ratings['UserID'].nunique(),
        "train_size": len(train_ratings),
        "val_size": len(val_ratings),
        "test_size": len(test_ratings),
        "sparsity": 1.0 - (len(ratings) / (len(movies) * ratings['UserID'].nunique()))
    },
    "model_comparison": metrics,
    "best_model": best_model_name,
    "test_results": test_metrics
}

with open(f'{ARTIFACTS_DIR}/model_results.json', 'w') as f:
    json.dump(results, f, indent=4)
    
print("Saved artifacts and results.")
