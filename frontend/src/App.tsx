import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import TasteBuilder from './pages/TasteBuilder';
import TasteReveal from './pages/TasteReveal';
import Recommendations from './pages/Recommendations';
import ResearchLab from './pages/ResearchLab';
import MovieDetail from './pages/MovieDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/build-taste" element={<TasteBuilder />} />
          <Route path="/taste-reveal" element={<TasteReveal />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/research" element={<ResearchLab />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
