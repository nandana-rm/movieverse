import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getModelResults, getRecommendations, type Movie } from '../lib/api';

// Metric Definitions
const METRICS_INFO: Record<string, string> = {
  "MAE": "Average absolute rating prediction error. Lower is better.",
  "RMSE": "Rating prediction error that penalizes larger mistakes more. Lower is better.",
  "Precision@10": "Among the top 10 recommended movies, how many were relevant. Higher is better.",
  "Recall@10": "How many of the user's relevant movies were recovered in the top 10. Higher is better.",
  "NDCG@10": "Measures ranking quality while rewarding relevant movies appearing nearer the top. Higher is better."
};

export default function ResearchLab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userSelections, setUserSelections] = useState<any[]>([]);
  const [userRecommendations, setUserRecommendations] = useState<Movie[]>([]);
  
  // UI State
  const [selectedMetric, setSelectedMetric] = useState("NDCG@10");
  const [expandedFactor, setExpandedFactor] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getModelResults();
      setResults(res);

      const storedProfile = sessionStorage.getItem('taste_profile');
      const storedSelection = sessionStorage.getItem('taste_selection');
      
      if (storedProfile) setUserProfile(JSON.parse(storedProfile));
      
      if (storedSelection) {
        const parsedSelection = JSON.parse(storedSelection);
        setUserSelections(parsedSelection);
        try {
          const recs = await getRecommendations(parsedSelection);
          setUserRecommendations(recs.best_matches || []);
        } catch (e) {
          console.error("Failed to load live recommendations for research page", e);
        }
      }
      
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Helper for model comparison bars
  const getMetricValue = (model: string, metric: string) => {
    const val = results?.model_comparison[model]?.[metric];
    return typeof val === 'number' ? val : 0;
  };

  const isLowerBetter = selectedMetric === "MAE" || selectedMetric === "RMSE";
  
  // Find min/max for scaling bars appropriately
  const metricValues = ["Baseline", "Item-Based KNN", "Collaborative (SVD)"].map(m => getMetricValue(m, selectedMetric));
  const maxVal = Math.max(...metricValues);
  const minVal = Math.min(...metricValues);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
      
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold text-sm tracking-widest uppercase">BACK</span>
        </button>
        <div className="hidden md:flex gap-6 text-xs font-bold tracking-widest uppercase text-slate-500">
          <a href="#question" className="hover:text-indigo-400 transition-colors">Overview</a>
          <a href="#data" className="hover:text-indigo-400 transition-colors">Data</a>
          <a href="#experiment" className="hover:text-indigo-400 transition-colors">Experiment</a>
          <a href="#models" className="hover:text-indigo-400 transition-colors">Models</a>
          <a href="#results" className="hover:text-indigo-400 transition-colors">Results</a>
          <a href="#cold-start" className="hover:text-indigo-400 transition-colors">Cold Start</a>
          <a href="#live-demo" className="hover:text-indigo-400 transition-colors">Live Demo</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 space-y-40">
        
        {/* 01 — THE QUESTION */}
        <section id="question" className="text-center space-y-12">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
            01 — The Question
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tighter">
            Can machine learning learn<br/>what people like to watch?
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            MovieVerse explores how recommendation systems learn patterns in movie preferences and use them to create personalized recommendations.
          </p>

          <div className="mt-16 bg-slate-900/60 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-md shadow-2xl max-w-4xl mx-auto text-left relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
             <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">WHAT WE INVESTIGATE</p>
             <p className="text-lg md:text-xl text-slate-200 italic font-serif leading-relaxed">
               "How effectively can machine learning methods learn movie preferences from historical user-rating data, and how can content-based similarity support recommendations for new users without prior rating history?"
             </p>
          </div>
        </section>

        {/* 02 — THE DATA */}
        <section id="data" className="space-y-16">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              02 — The Data
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">THE DATA BEHIND MOVIEVERSE</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              MovieVerse learns from MovieLens 1M — a public movie-rating dataset containing interactions between thousands of users and movies.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "RATINGS", value: results?.dataset_stats?.total_ratings.toLocaleString() },
              { label: "USERS", value: results?.dataset_stats?.total_users.toLocaleString() },
              { label: "MOVIES", value: results?.dataset_stats?.total_movies.toLocaleString() },
              { label: "SPARSE", value: `${(results?.dataset_stats?.sparsity * 100).toFixed(2)}%` }
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-xs font-bold text-indigo-400 tracking-widest uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">A VERY SPARSE WORLD</h3>
            <p className="text-slate-400 max-w-2xl mx-auto mb-12">
              Most users rate only a tiny fraction of all available movies. The challenge is learning preference patterns from the ratings that do exist.
            </p>

            {/* Conceptual Matrix */}
            <div className="font-mono text-xs sm:text-sm text-slate-500 overflow-x-auto">
              <div className="inline-block text-left">
                <div className="flex mb-4 border-b border-white/10 pb-2">
                  <div className="w-24 font-bold text-slate-400">MOVIES →</div>
                  <div className="w-12 text-center">M1</div>
                  <div className="w-12 text-center">M2</div>
                  <div className="w-12 text-center">M3</div>
                  <div className="w-12 text-center">M4</div>
                  <div className="w-12 text-center">M5</div>
                  <div className="w-12 text-center">M6</div>
                </div>
                {[
                  [5, '·', 4, '·', '·', 3],
                  ['·', 3, '·', 5, '·', '·'],
                  [4, '·', '·', '·', 2, '·'],
                  ['·', '·', 5, '·', 4, '·'],
                  ['·', 2, '·', '·', '·', 5]
                ].map((row, i) => (
                  <div key={i} className="flex mb-3">
                    <div className="w-24 font-bold text-slate-400">USER {i+1}</div>
                    {row.map((cell, j) => (
                      <div key={j} className={`w-12 text-center ${cell !== '·' ? 'text-indigo-400 font-bold' : 'text-slate-700'}`}>
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 text-xs font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 inline-block px-4 py-2 rounded-full">
              {(results?.dataset_stats?.sparsity * 100).toFixed(2)}% OF USER–MOVIE PAIRS ARE UNOBSERVED
            </div>
          </div>
        </section>

        {/* 03 — THE RECOMMENDATION PROBLEM */}
        <section className="text-center space-y-12">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
            03 — The Recommendation Problem
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">We Know This</h3>
              <div className="space-y-4 text-left font-mono">
                <div className="text-indigo-400">User A:</div>
                <div className="text-slate-300">★★★★★ Movie X</div>
                <div className="text-slate-300">★★★★<span className="text-slate-700">★</span> Movie Y</div>
                <div className="text-slate-300">★★★★★ Movie Z</div>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-dashed border-indigo-500/50 rounded-2xl p-8 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">But Not This</h3>
              <p className="text-slate-400 font-mono">How would User A feel about Movie Q?</p>
            </div>
          </div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-3xl font-extrabold text-white tracking-tight pt-8"
          >
            THAT IS THE RECOMMENDATION PROBLEM.
          </motion.h2>
        </section>

        {/* 04 — THE EXPERIMENT */}
        <section id="experiment" className="space-y-12">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              04 — The Experiment
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">HOW WE TESTED THE MODELS</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Ratings were ordered chronologically before splitting, so the models learn from earlier interactions and are evaluated on later ones.
            </p>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 overflow-hidden">
            <div className="flex justify-between text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
              <span>Earlier Ratings</span>
              <span>Later Ratings</span>
            </div>
            
            <div className="flex h-12 rounded-lg overflow-hidden mb-8">
              <div className="w-[80%] bg-indigo-600 flex items-center justify-center text-white font-bold text-sm border-r border-slate-900">
                TRAIN (80%)
              </div>
              <div className="w-[10%] bg-purple-600 flex items-center justify-center text-white font-bold text-sm border-r border-slate-900">
                VAL
              </div>
              <div className="w-[10%] bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                TEST
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-indigo-400 font-bold mb-2">TRAIN ({results?.dataset_stats?.train_size.toLocaleString()} ratings)</h4>
                <p className="text-sm text-slate-400">Learn model parameters from historical data.</p>
              </div>
              <div>
                <h4 className="text-purple-400 font-bold mb-2">VALIDATION ({results?.dataset_stats?.val_size.toLocaleString()} ratings)</h4>
                <p className="text-sm text-slate-400">Compare models and select the winner.</p>
              </div>
              <div>
                <h4 className="text-slate-300 font-bold mb-2">TEST ({results?.dataset_stats?.test_size.toLocaleString()} ratings)</h4>
                <p className="text-sm text-slate-400">Evaluate the selected model on untouched data.</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <span className="inline-block bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-full tracking-widest">
                TEST DATA WAS NOT USED FOR MODEL SELECTION.
              </span>
            </div>
          </div>
        </section>

        {/* 05 — THE MODELS */}
        <section id="models" className="space-y-12">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              05 — The Models
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">THREE MODELS ENTERED THE EXPERIMENT</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pop */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="text-xs font-bold tracking-widest text-slate-500 mb-4">MODEL 01</div>
              <h3 className="text-xl font-bold text-white mb-2">POPULARITY BASELINE</h3>
              <div className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase tracking-widest mb-6">Benchmark</div>
              <p className="text-sm text-slate-400 mb-8 flex-1">
                Recommends movies based on overall popularity rather than personalized user preferences. A baseline tells us whether more sophisticated models actually improve recommendation quality.
              </p>
              <div className="font-mono text-xs text-indigo-400 space-y-2">
                <div>ALL USERS</div>
                <div>↓</div>
                <div>POPULARITY SIGNAL</div>
                <div>↓</div>
                <div>TOP MOVIES</div>
              </div>
            </div>

            {/* KNN */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="text-xs font-bold tracking-widest text-slate-500 mb-4">MODEL 02</div>
              <h3 className="text-xl font-bold text-white mb-2">ITEM-BASED KNN</h3>
              <div className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase tracking-widest mb-6">Neighbor-Based</div>
              <p className="text-sm text-slate-400 mb-8 flex-1">
                Finds movies with similar rating patterns across users.
              </p>
              <div className="font-mono text-xs text-indigo-400 space-y-2 mb-6">
                <div>Movie A</div>
                <div>/ &nbsp; \</div>
                <div>Movie B &nbsp; Movie C</div>
                <div>| &nbsp; &nbsp; |</div>
                <div>Movie D — Movie E</div>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">
                Conceptual view of item-based nearest neighbors
              </div>
            </div>

            {/* SVD */}
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="text-xs font-bold tracking-widest text-indigo-400 mb-4">MODEL 03</div>
              <h3 className="text-xl font-bold text-white mb-2">COLLABORATIVE SVD</h3>
              <div className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-bold uppercase tracking-widest mb-6">Latent Factor Model</div>
              <p className="text-sm text-slate-400 mb-8 flex-1">
                SVD learns hidden, or latent, factors from patterns in the user–movie rating matrix.
              </p>
              <div className="font-mono text-xs text-purple-400 space-y-2 mb-6">
                <div>USER × MOVIE RATINGS</div>
                <div>↓</div>
                <div>MATRIX FACTORIZATION</div>
                <div>↙ &nbsp; &nbsp; ↘</div>
                <div>USER FACTORS &nbsp; MOVIE FACTORS</div>
                <div>↘ &nbsp; &nbsp; ↙</div>
                <div>PREDICTED PREFERENCES</div>
              </div>
              <button 
                onClick={() => setExpandedFactor(!expandedFactor)}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                WHAT IS A LATENT FACTOR? {expandedFactor ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
              </button>
              <AnimatePresence>
                {expandedFactor && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <p className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded">
                      An underlying preference pattern learned from the data rather than explicitly supplied as a movie label.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 06 — MODEL COMPARISON */}
        <section id="results" className="space-y-12">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              06 — Model Comparison
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">WHICH MODEL PERFORMED BEST?</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              All models were evaluated using the same chronological validation split.
            </p>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 md:p-12">
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {Object.keys(METRICS_INFO).map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-colors ${
                    selectedMetric === metric 
                      ? "bg-indigo-600 text-white" 
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-8">
                <h3 className="text-xl font-bold text-white">{selectedMetric}</h3>
                <div className="group relative cursor-help">
                  <Info className="w-4 h-4 text-slate-500" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-xs text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {METRICS_INFO[selectedMetric]}
                  </div>
                </div>
                <span className="ml-auto text-sm font-bold text-indigo-400 tracking-widest uppercase">
                  {isLowerBetter ? "↓ LOWER IS BETTER" : "↑ HIGHER IS BETTER"}
                </span>
              </div>

              <div className="space-y-6">
                {["Baseline", "Item-Based KNN", "Collaborative (SVD)"].map(model => {
                  const val = getMetricValue(model, selectedMetric);
                  // Calculate width percentage. If lower is better, we still want to show relative scale, but we don't invert the bar length.
                  // Just standard proportion of max.
                  const width = (val / maxVal) * 100;
                  const isWinner = model === "Collaborative (SVD)"; // Based on JSON artifact
                  
                  return (
                    <div key={model} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className={isWinner ? "text-indigo-300" : "text-slate-400"}>
                          {model === "Baseline" ? "Popularity Baseline" : model}
                        </span>
                        <span className={isWinner ? "text-white" : "text-slate-400"}>
                          {val.toFixed(4)} {isWinner && <span className="text-yellow-400 ml-1">★</span>}
                        </span>
                      </div>
                      <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${width}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isWinner ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-slate-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 07 — THE SELECTED MODEL */}
        <section className="space-y-12">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              07 — The Selected Model
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center relative overflow-hidden shadow-2xl shadow-indigo-900/20">
            <div className="text-yellow-400 mb-4 flex justify-center">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="text-xs font-bold tracking-widest text-indigo-300 mb-2 uppercase">★ Selected Model</div>
            <h3 className="text-4xl font-extrabold text-white mb-4">COLLABORATIVE SVD</h3>
            <p className="text-xl text-indigo-200 font-mono mb-8">
              Validation NDCG@10: {results?.model_comparison["Collaborative (SVD)"]["NDCG@10"].toFixed(4)}
            </p>
            <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
              SVD achieved the highest validation NDCG@10 and was therefore selected as the final historical model. It outperformed the other compared models on the listed validation metrics.
            </p>
          </div>

          {/* Held Out Test */}
          <div className="pt-16 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">ONE FINAL CHECK.</h3>
              <p className="text-slate-400">
                After model selection, the already-trained SVD model was evaluated on the untouched held-out test set.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
              <div className="font-mono text-sm text-slate-500 text-center md:text-right space-y-4">
                <div>TRAIN</div>
                <div>↓</div>
                <div>VALIDATE MODELS</div>
                <div>↓</div>
                <div className="text-indigo-400 font-bold">SELECT SVD</div>
                <div>↓</div>
                <div className="text-white">UNTOUCHED TEST</div>
                <div>↓</div>
                <div className="text-white">FINAL EVALUATION</div>
              </div>
              
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
                {Object.entries(results?.test_results || {}).map(([metric, val]: any) => (
                  <div key={metric}>
                    <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">{metric}</div>
                    <div className="text-xl font-bold text-white">{val.toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 08 — THE COLD-START PROBLEM */}
        <section id="cold-start" className="space-y-24 pt-24 border-t border-white/5">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">
              08 — But there is a problem...
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-12">WHAT ABOUT A BRAND-NEW USER?</h2>
            
            <div className="max-w-md mx-auto bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-8 mb-12">
              <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">NEW USER</h3>
              <div className="space-y-3 text-left font-mono text-sm text-slate-400">
                <div className="flex justify-between"><span>Ratings:</span> <span className="text-white">0</span></div>
                <div className="flex justify-between"><span>History:</span> <span className="text-white">0</span></div>
                <div className="flex justify-between"><span>Known preferences:</span> <span className="text-white">?</span></div>
              </div>
            </div>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-16">
              SVD and KNN rely on historical user–movie interactions. A new MovieVerse visitor has no MovieLens user history.
            </p>

            <h3 className="text-3xl font-extrabold text-indigo-400">SO HOW CAN WE RECOMMEND ANYTHING?</h3>
          </div>
        </section>

        {/* 09 — BUILDING YOUR MOVIE DNA */}
        <section className="space-y-16">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              09 — Building Your Movie DNA
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">FROM YOUR MOVIES TO YOUR MOVIE DNA</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              The live cold-start process translates a handful of explicit movie selections into a weighted genre representation.
            </p>
          </div>

          <div className="flex flex-col items-center font-mono text-sm space-y-4">
            <div className="bg-slate-800 px-6 py-3 rounded border border-slate-700 text-white">SELECTED MOVIES</div>
            <div className="text-indigo-500">↓</div>
            <div className="bg-slate-800 px-6 py-3 rounded border border-slate-700 text-white">MOVIE GENRES</div>
            <div className="text-indigo-500">↓</div>
            <div className="bg-slate-800 px-6 py-3 rounded border border-slate-700 text-white">TF-IDF REPRESENTATION</div>
            <div className="text-indigo-500">↓</div>
            <div className="bg-indigo-900/40 px-6 py-3 rounded border border-indigo-500/50 text-indigo-200 font-bold">WEIGHTED USER PROFILE</div>
            <div className="text-indigo-500">↓</div>
            <div className="bg-slate-800 px-6 py-3 rounded border border-slate-700 text-white">COSINE SIMILARITY</div>
            <div className="text-indigo-500">↓</div>
            <div className="bg-slate-800 px-6 py-3 rounded border border-slate-700 text-white">RANKED MOVIES</div>
            <div className="text-indigo-500">↓</div>
            <div className="bg-purple-900/40 px-6 py-3 rounded border border-purple-500/50 text-purple-200 font-bold">YOUR MOVIEVERSE</div>
          </div>

          <div className="max-w-2xl mx-auto bg-slate-900 border border-white/5 rounded-2xl p-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
              {userProfile ? "YOUR ACTUAL TASTE PROFILE" : "EXAMPLE TASTE PROFILE"}
            </h3>
            
            <div className="space-y-4 font-mono text-sm">
              {(userProfile || [
                { genre: "Comedy", percentage: 45 },
                { genre: "Romance", percentage: 25 },
                { genre: "Drama", percentage: 15 },
                { genre: "Action", percentage: 10 },
                { genre: "Sci-Fi", percentage: 5 }
              ]).map((g: any) => (
                <div key={g.genre} className="flex items-center">
                  <div className="w-24 text-slate-300">{g.genre}</div>
                  <div className="flex-1 text-indigo-500 tracking-[-0.2em]">
                    {"█".repeat(Math.max(1, Math.floor(g.percentage / 4)))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10 — COSINE SIMILARITY */}
        <section className="space-y-12">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              10 — Cosine Similarity
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">HOW DOES MOVIEVERSE MEASURE A MATCH?</h2>
          </div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-12 items-center bg-slate-900 border border-white/5 rounded-2xl p-8 md:p-12">
            <div className="font-mono text-sm text-slate-400 flex flex-col items-center">
               <div className="text-indigo-400 font-bold mb-4">YOUR TASTE PROFILE</div>
               <div>↘</div>
               <div> \ θ</div>
               <div>  \</div>
               <div>   ↘ <span className="text-white">MOVIE PROFILE</span></div>
               <div className="mt-8 text-center bg-slate-800 p-4 rounded text-slate-300 w-full">
                 closer direction<br/>=<br/>stronger taste alignment
               </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">COSINE SIMILARITY</h3>
              <p className="text-slate-400">
                Cosine similarity compares the direction of the user's genre profile with each candidate movie's genre representation.
              </p>
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-6 text-center">
                <div className="text-lg font-bold text-white">TASTE MATCH</div>
                <div className="text-slate-400 my-2">=</div>
                <div className="text-indigo-300 font-mono">COSINE SIMILARITY × 100</div>
              </div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                Taste Match is a similarity score — not a probability and not classification accuracy.
              </p>
            </div>
          </div>
        </section>

        {/* 11 — SEE THE ML IN ACTION */}
        <section id="live-demo" className="space-y-12">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              11 — See the ML in Action
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">SEE YOUR MOVIE DNA IN ACTION</h2>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900/60 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
            {userProfile && userSelections.length > 0 ? (
              <div className="space-y-12">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-6">YOUR INPUT</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {userSelections.map(s => (
                       <div key={s.movie_id} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded text-sm text-slate-300">
                         {s.title} <span className="text-indigo-400 ml-1">★{s.rating}</span>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="text-indigo-500">↓</div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-6">YOUR STRONGEST GENRE SIGNALS</h3>
                  <div className="flex justify-center gap-4">
                    {userProfile.slice(0, 3).map((g: any) => (
                      <div key={g.genre} className="text-lg font-bold text-white">
                        {g.genre} <span className="text-indigo-400 text-sm font-mono">{g.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-indigo-500">↓</div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-6">SIMILARITY SEARCH</h3>
                  <div className="font-mono text-sm text-slate-300 max-w-md mx-auto text-left space-y-4 relative pl-8">
                     <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-700"></div>
                     <div className="absolute top-0 left-2 bg-slate-900 text-indigo-400 font-bold px-1 -mt-3">YOUR PROFILE</div>
                     
                     {userRecommendations.slice(0, 5).map(m => (
                       <div key={m.MovieID} className="flex items-center gap-4 relative">
                         <div className="absolute left-[-16px] w-4 border-t border-slate-700"></div>
                         <div className="text-indigo-400 w-12 text-right">{(m.match_score! / 100).toFixed(3)}</div>
                         <div className="text-slate-500">→</div>
                         <div className="truncate flex-1" title={m.Title}>{m.Title}</div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12">
                <h3 className="text-xl font-bold text-white mb-6">BUILD YOUR MOVIE DNA TO SEE THIS LIVE</h3>
                <button 
                  onClick={() => navigate('/build-taste')}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold uppercase tracking-wide transition-colors"
                >
                  Build My Movie DNA →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 12 — WHY SCORES CLUSTER */}
        <section className="space-y-8 max-w-3xl mx-auto text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">
            12 — Feature Representation
          </div>
          <h2 className="text-2xl font-bold text-white">WHY CAN MATCH SCORES CLUSTER TOGETHER?</h2>
          <p className="text-slate-400 leading-relaxed">
            MovieVerse's cold-start representation is based on a relatively small set of genre features. Movies sharing similar genre combinations can therefore produce identical or very close cosine-similarity values. This is a limitation of the feature representation.
          </p>
        </section>

        {/* 13 — WHAT WE CAN AND CANNOT LEARN */}
        <section className="space-y-12 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">
              13 — Limitations
            </div>
            <h2 className="text-3xl font-bold text-white">EVERY MODEL HAS LIMITS.</h2>
            <p className="text-slate-400 mt-4">Richer features could improve future versions.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
              <h3 className="text-sm font-bold text-emerald-400 tracking-widest uppercase mb-6">CURRENTLY USES</h3>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> MovieLens rating patterns</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> User–movie interactions</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Movie genres</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Selected movie ratings</li>
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
              <h3 className="text-sm font-bold text-rose-400 tracking-widest uppercase mb-6">DOES NOT CURRENTLY MODEL</h3>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-3"><span className="text-rose-500 font-bold w-5 text-center">×</span> Plot semantics</li>
                <li className="flex items-center gap-3"><span className="text-rose-500 font-bold w-5 text-center">×</span> Actors</li>
                <li className="flex items-center gap-3"><span className="text-rose-500 font-bold w-5 text-center">×</span> Directors</li>
                <li className="flex items-center gap-3"><span className="text-rose-500 font-bold w-5 text-center">×</span> Reviews</li>
                <li className="flex items-center gap-3"><span className="text-rose-500 font-bold w-5 text-center">×</span> Cinematography</li>
                <li className="flex items-center gap-3"><span className="text-rose-500 font-bold w-5 text-center">×</span> Natural-language descriptions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 14 — CONCLUSION */}
        <section className="pt-24 border-t border-white/5 text-center space-y-12">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
            14 — Conclusion
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            SO, CAN MACHINE LEARNING LEARN<br/>WHAT PEOPLE LIKE TO WATCH?
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-indigo-400 mb-6">YES — WITH LIMITATIONS.</h3>
            <p className="text-xl text-slate-300 leading-relaxed mb-16">
              On historical MovieLens data, Collaborative SVD produced the strongest validation ranking performance among the models tested. For new users without historical interactions, MovieVerse uses genre-based TF-IDF and cosine similarity to construct an immediate cold-start recommendation profile.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                onClick={() => navigate('/build-taste')}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold uppercase tracking-wide transition-colors"
              >
                {userProfile ? "Refine My Movie DNA" : "Build My Movie DNA"}
              </button>
              {userProfile && (
                <button 
                  onClick={() => navigate('/recommendations')}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold uppercase tracking-wide transition-colors"
                >
                  Explore My MovieVerse
                </button>
              )}
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
}
