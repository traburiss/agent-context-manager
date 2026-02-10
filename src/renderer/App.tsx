import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './stores/useStore';
import { useTranslation } from 'react-i18next';
import { Layout } from './components/Layout';
import Startup from './pages/Startup';
import Agents from './pages/Agents';
import Skills from './pages/Skills';
import Rules from './pages/Rules';

export default function App() {
  const { systemConfig, initializeApp } = useStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    initializeApp();
  }, []);

  // Apply theme
  useEffect(() => {
    if (!systemConfig) return;

    const theme = systemConfig.theme || 'system';
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.body.setAttribute('arco-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.removeAttribute('arco-theme');
      document.documentElement.classList.remove('dark');
    }
  }, [systemConfig?.theme]);

  // Sync language
  useEffect(() => {
    if (systemConfig?.language && i18n.language !== systemConfig.language) {
      i18n.changeLanguage(systemConfig.language);
    }
  }, [systemConfig?.language, i18n]);

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
