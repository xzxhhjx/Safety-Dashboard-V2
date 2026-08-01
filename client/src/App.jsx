import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Overview from './pages/Overview';
import Observations from './pages/Observations';
import Analytics from './pages/Analytics';
import WorkAreas from './pages/WorkAreas';
import PeopleTeams from './pages/PeopleTeams';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
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
        <Route path="/work-areas" element={
          <AppShell><WorkAreas /></AppShell>
        } />
        <Route path="/people-teams" element={
          <AppShell><PeopleTeams /></AppShell>
        } />
        <Route path="/settings" element={
          <AppShell><Settings /></AppShell>
        } />

        {/* Admin — standalone (no sidebar) */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </ErrorBoundary>
  );
}
