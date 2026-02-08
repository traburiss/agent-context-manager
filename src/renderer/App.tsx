import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Startup from './pages/Startup';
import Agents from './pages/Agents';
import Skills from './pages/Skills';
import Rules from './pages/Rules';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Startup />} />
        <Route element={<Layout />}>
          <Route path="/agents" element={<Agents />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/rules" element={<Rules />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
