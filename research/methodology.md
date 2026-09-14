# Research Methodology: MovieVerse

## 1. Problem Statement
How to effectively predict user movie preferences based on their past ratings to generate high-quality personalized recommendations?

## 2. Research Question
How effectively can machine-learning-based collaborative, content-based, and hybrid recommendation approaches predict a user's movie preferences and generate personalized movie recommendations from historical movie-rating data?

## 3. Hypotheses
- **H0:** There is no meaningful improvement in recommendation performance when using ML-based approaches compared with a simple popularity baseline.
- **H1:** At least one ML-based approach produces meaningfully better recommendation performance than the baseline on held-out test data.

## 4. Dataset
MovieLens-1M Dataset. Contains 1,000,209 anonymous ratings of approximately 3,900 movies made by 6,040 MovieLens users.

## 5. Data Preprocessing
- Filtered for minimal dataset integrity.
- Extracted temporal data and sorted interactions by timestamp.

## 6. Feature Engineering
- Processed movie genres into TF-IDF vectors for the Content-Based Cold-Start pathway.
- Mapped items to internal indices for SVD.

## 7. Experimental Design
We evaluate a Popularity Baseline against a Matrix Factorization (SVD) collaborative filtering model. A content-based approach using genre TF-IDF is maintained specifically for new-user cold-start pathways in the application.

## 8. Models
- **Popularity Baseline:** Global item average rating adjusted by confidence/popularity.
- **Collaborative Filtering:** SVD (Singular Value Decomposition) using Matrix Factorization to learn latent user and item vectors.

## 9. Train/Validation/Test Split
A chronological split strategy was adopted to prevent temporal data leakage:
- 80% Train
- 10% Validation
- 10% Test

## 10. Evaluation Metrics
- **Rating Prediction:** MAE, RMSE
- **Ranking Quality:** Precision@10, Recall@10, NDCG@10

## 11. Model Selection
The model with the highest NDCG@10 on the validation set is selected as the winning architecture to power the application.

## 12. Limitations
- MovieLens represents a specific demographic of users.
- Historic ratings contain inherent popularity bias.
- Recommendations for completely new users heavily rely on simple content heuristics (cold start).
