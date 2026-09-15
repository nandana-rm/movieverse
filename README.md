# MovieVerse — Your Taste. Decoded.

## 1. Project Overview
MovieVerse is a machine learning-powered movie recommendation platform designed to deliver personalized content discovery. Built with a full-stack architecture, it leverages collaborative filtering techniques on historical rating data to model user preferences. The project is structured to ensure robust evaluation of recommendation algorithms, culminating in a production-ready web application.

## 2. Live Demo
**[MovieVerse — Your Taste. Decoded.](https://frontend-1uqm61rzl-nandanamenon-3196s-projects.vercel.app/)**

The application is deployed with Vercel for the frontend and Render for the FastAPI backend.

## 3. Research Question
How effectively can machine learning methods learn movie preferences from historical user-rating data, and how can content-based similarity support recommendations for new users without prior rating history?

## 4. Results

### Validation Model Comparison
We evaluated multiple models on a validation set. The metrics below represent the performance of each model.

**Popularity Baseline:**
- **MAE:** 0.7866126790102399
- **RMSE:** 0.983176466424425
- **Precision@10:** 0.795817683374347
- **Recall@10:** 0.44088949957447837
- **NDCG@10:** 0.8614960042246872

**Item-Based KNN:**
- **MAE:** 0.9101048293598081
- **RMSE:** 1.1038435886817821
- **Precision@10:** 0.6739681820144195
- **Recall@10:** 0.4083994900507475
- **NDCG@10:** 0.7130025559892122

*(Note: Item-Based KNN performed worse across all ranking metrics and is reported honestly as a baseline comparison.)*

**Collaborative SVD:**
- **MAE:** 0.764036486344522
- **RMSE:** 0.9599965184405257
- **Precision@10:** 0.8015293787505936
- **Recall@10:** 0.44332066232397616
- **NDCG@10:** 0.8708815502213667

The Collaborative SVD model was **selected strictly by validation NDCG@10**, as it provided the highest ranking quality.

### Held-Out Test Results
The held-out test set was **not** used for fitting, tuning, or model selection. The same already-trained SVD model selected on the validation set was evaluated on the held-out test set to ensure an unbiased measure of its generalization performance.

**Selected SVD held-out test results:**
- **MAE:** 0.7170451867993928
- **RMSE:** 0.915694607328468
- **Precision@10:** 0.7729480653091765
- **Recall@10:** 0.4586219919255539
- **NDCG@10:** 0.8437698802118456

## 5. Dataset
The project utilizes the benchmark **MovieLens-1M** dataset:
- **Ratings:** 1,000,209
- **Users:** 6,040
- **Movies:** 3,883
- **Data Split:** A strict chronological 80/10/10 (Train / Validation / Test) split was employed to prevent data leakage.
- **Sparsity:** Approximately 95.73% sparsity.

## 6. Methodology
Our pipeline implements and compares multiple algorithms to understand their strengths and weaknesses:
- **Popularity Baseline:** Recommends the most globally rated/popular items.
- **Item-Based KNN:** Computes similarities between items based on user rating patterns.
- **Collaborative SVD / Matrix Factorization:** Factorizes the user-item interaction matrix to learn latent feature representations of users and movies.
- **TF-IDF + Cosine Similarity:** Used exclusively as the live new-user cold-start strategy for content-based onboarding, not as a historical model comparison method. The application's "Taste Match" indicator represents this cosine similarity, not a predicted rating or absolute probability of accuracy.

## 7. Evaluation Metrics
The models were evaluated using both error-based and ranking-based metrics:
- **MAE (Mean Absolute Error):** Measures the average magnitude of rating prediction errors.
- **RMSE (Root Mean Squared Error):** Penalizes larger prediction errors more heavily.
- **Precision@10:** Proportion of recommended top-10 items that are actually relevant.
- **Recall@10:** Proportion of all relevant items that are successfully recommended in the top-10.
- **NDCG@10 (Normalized Discounted Cumulative Gain):** Measures the ranking quality, heavily rewarding relevant items placed higher in the recommendation list.

*Note: For Precision, Recall, and NDCG calculations, a relevance threshold of **rating >= 3.5** was applied to binarize explicit feedback.*

## 8. Recommendation Pipeline
1. **Data Preprocessing:** Chronological splitting and binarization of relevance.
2. **Model Training:** Training baseline, KNN, and SVD models on the 80% training set.
3. **Model Selection:** Validating against the 10% validation set using NDCG@10.
4. **Final Evaluation:** Testing the selected model against the 10% held-out set.
5. **Cold-Start Handling:** Employing TF-IDF and Cosine Similarity for new users without historical ratings.

## 9. Technology Stack
- **Machine Learning:** `scikit-learn`, `scikit-surprise`, `numpy`, `pandas`
- **Backend:** Python, FastAPI, Uvicorn, Pydantic
- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **External APIs:** TMDB API (for visual enrichment only)

## 10. Local Setup

### Prerequisites
- Python 3.11.9
- Node.js 18+

### Backend Setup
```bash
# Clone the repository and navigate to the project root
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
# From the repository root
uvicorn backend.main:app --reload
```
The backend API will run on `http://localhost:8000`.

### Frontend Setup
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run on the URL provided by Vite (typically `http://localhost:5173`).

## 11. Deployment Architecture
- **Version Control:** GitHub
- **Frontend Hosting:** Vercel (CI/CD integrated)
- **Backend Hosting:** Render (FastAPI web service)
- **External Enrichment:** TMDB API integration. **Note:** TMDB metadata is purely for visual presentation (posters, descriptions) in the user interface and is **not** used to train the machine learning models.

## 12. Limitations
- **Sparsity Challenges:** At ~95.73% sparsity, many niche items suffer from poor collaborative representations.
- **Cold-Start Phase:** While TF-IDF content similarity provides recommendations for new users, it is less expressive than the collaborative SVD model evaluated on users with historical rating data.
- **Static Model:** The SVD model relies on offline training. Real-time rating updates from users are not immediately folded into the matrix factorization.

## 13. Dataset and API Credits
- **Dataset:** [MovieLens 1M Dataset](https://grouplens.org/datasets/movielens/1m/) by GroupLens Research.
- **Metadata API:** "This product uses the TMDB API but is not endorsed or certified by TMDB."

## 14. Project Structure
```text
movieverse/
├── backend/
│   ├── .env.example
│   ├── catalogue.json
│   └── main.py
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vercel.json
│   ├── vite.config.ts
│   └── .oxlintrc.json
├── ml/
│   ├── artifacts/
│   └── train_pipeline.py
├── research/
│   └── methodology.md
├── scripts/
│   └── build_catalogue.py
├── .python-version
├── DEPLOYMENT.md
├── movies.dat
├── ratings.dat
├── README.md
├── requirements.txt
└── users.dat
```
