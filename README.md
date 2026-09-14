# MOVIEVERSE

MovieVerse is an end-to-end machine-learning movie recommendation platform built as a Research Methodology final project.

## Project Structure
- `ml/`: Contains the machine learning pipeline that parses the MovieLens dataset, trains models, evaluates them chronologically, and exports the best model and artifacts.
- `backend/`: A FastAPI backend that serves the movie catalog and recommendation predictions.
- `frontend/`: A React + Vite + Tailwind frontend featuring a cinematic user interface.
- `research/`: Academic documentation for methodology and limitations.

## Running the Project

### Prerequisites
- Python 3.10+
- Node.js 18+
- `uv` (for fast python package management)

### 1. ML Pipeline & Data
The dataset `ml-1m` is placed in the root directory.
To re-run the ML pipeline:
```bash
uv venv
uv pip install pandas numpy scikit-learn scikit-surprise tqdm fastapi uvicorn
.venv\Scripts\python ml\train_pipeline.py
.venv\Scripts\python scripts\build_catalogue.py
```

### 2. Start the Backend
```bash
.venv\Scripts\uvicorn backend.main:app --port 8000
```
API runs on `http://localhost:8000`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`
