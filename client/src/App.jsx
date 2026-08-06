import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import Overview from './pages/Overview';
import Observations from './pages/Observations';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Routes>
          {/* Public HSE Platform — with sidebar shell */}
          <Route path="/" element={
            <AppShell><Overview /></AppShell>
          } />
          <Route path="/observations" element={
            <AppShell><Observations /></AppShell>
          } />
          <Route path="/analytics" element={
            <AppShell><Analytics /></AppShell>
          } />

          {/* Admin — standalone (no sidebar) */}
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
