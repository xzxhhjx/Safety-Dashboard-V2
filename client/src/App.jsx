import { Routes, Route } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import Overview from './pages/Overview';
import Observations from './pages/Observations';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import EmbeddedApp from './pages/EmbeddedApp';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<AppShell><Overview /></AppShell>} />
      <Route path="/observations" element={<AppShell><Observations /></AppShell>} />
      <Route path="/analytics" element={<AppShell><Analytics /></AppShell>} />
      <Route path="/overtime" element={
        <AppShell><EmbeddedApp title={t('nav.overtime')} src="https://tcc-ytl-ot.vercel.app/overtime" /></AppShell>
      } />
      <Route path="/daily" element={
        <AppShell><EmbeddedApp title={t('nav.daily')} src="https://tcc-ytl-ot.vercel.app/daily-home" /></AppShell>
      } />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </ThemeProvider>
    </LanguageProvider>
  );
}
