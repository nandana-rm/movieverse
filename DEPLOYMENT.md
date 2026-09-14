# MovieVerse Deployment Checklist & Configuration

This document outlines the steps and configuration required to successfully deploy MovieVerse to a production environment (Vercel and Render) on their free tiers.

----------------------------------------
## GITHUB
----------------------------------------

**Repository structure:**
```
movieverse/
├── backend/
│   ├── .env.example
│   ├── catalogue.json
│   └── main.py
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vercel.json
├── ml/
│   └── artifacts/
│       ├── best_model.pkl (~26MB)
│       ├── svd_model.pkl (~26MB)
│       ├── tfidf_matrix.pkl
│       ├── tfidf_vectorizer.pkl
│       └── model_results.json
├── movies.dat (Required at runtime)
├── ratings.dat
├── users.dat
├── requirements.txt
└── .gitignore
```

**Files safe to commit:**
All source code, `ml/artifacts/*` (all under 100MB), `*.dat` files, `package.json`, `requirements.txt`, `backend/.env.example`.

**Files NOT to commit:**
`backend/.env`, `.env`, `node_modules/`, `__pycache__/`, `.venv/`

----------------------------------------
## VERCEL (FRONTEND)
----------------------------------------

- **Framework:** Vite
- **Root directory:** `frontend`
- **Install command:** `npm install` (default)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:**
  - `VITE_API_BASE_URL`: `https://YOUR-BACKEND.onrender.com/api` (The `/api` path is essential depending on your backend routes).
- **Notes:** A `vercel.json` has been included in the `frontend/` directory to ensure client-side routing works without throwing 404 errors on page refresh.

----------------------------------------
## RENDER (BACKEND)
----------------------------------------

- **Service type:** Web Service
- **Root directory:** `.` (Repository Root)
- **Runtime:** Python 3
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables:**
  - `TMDB_READ_ACCESS_TOKEN`: The actual token.
  - `FRONTEND_URL`: `https://YOUR-FRONTEND.vercel.app` (This secures the CORS configuration).
- **Notes:** The backend relies on `movies.dat` being present in the execution root directory. Setting the Render Root Directory to the repository root satisfies this requirement. A `/health` endpoint has been added for Render's health checks.

----------------------------------------
## BLOCKERS
----------------------------------------
- None. The `.gitignore` was fixed, unused typescript variables in production were suppressed, the health check was added, CORS was secured via env vars, and the codebase no longer strictly relies on hardcoded `localhost`. 
- **Important:** Ensure you do NOT commit the existing untracked `backend/.env` file to Git when you initialize the repository. 

----------------------------------------
## FINAL STATUS
----------------------------------------
MOVIEVERSE IS DEPLOYMENT-READY.
