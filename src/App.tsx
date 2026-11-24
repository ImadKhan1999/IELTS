import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { store } from './lib/storage';
import { useStore } from './data/catalog';
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
import TestPlayer from './pages/TestPlayer';
import Result from './pages/Result';
import Writing from './pages/Writing';
import Speaking from './pages/Speaking';
import Tutor from './pages/Tutor';
import ImportPage from './pages/ImportPage';
import Calculator from './pages/Calculator';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const settings = useStore(store.settings);
  const loc = useLocation();
  const fullScreen = loc.pathname.startsWith('/test/');

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const routes = (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/tests/:skill" element={<Catalogue />} />
      <Route path="/test/:id" element={<TestPlayer />} />
      <Route path="/result/:id" element={<Result />} />
      <Route path="/writing" element={<Writing />} />
      <Route path="/speaking" element={<Speaking />} />
      <Route path="/tutor" element={<Tutor />} />
      <Route path="/import" element={<ImportPage />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );

  if (fullScreen) return routes;

  return (
    <div className="shell">
      <aside className="side">
        <div className="logo"><span>IELTS</span> Practice</div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <div className="group">Practice</div>
          <NavLink to="/tests/listening">Listening</NavLink>
          <NavLink to="/tests/reading">Reading</NavLink>
          <NavLink to="/writing">Writing</NavLink>
          <NavLink to="/speaking">Speaking</NavLink>
          <div className="group">Tools</div>
          <NavLink to="/tutor">AI Tutor</NavLink>
          <NavLink to="/calculator">Band calculator</NavLink>
          <NavLink to="/import">Import tests</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>
      <main className="main">{routes}</main>
    </div>
  );
}
