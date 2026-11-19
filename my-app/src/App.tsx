import { lazy, Suspense } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuthContext';
import { ThemeProvider } from './hooks/ThemeContext';
import { useTheme } from './hooks/useTheme';
import { TimerProvider } from './hooks/TimerContext';
import { useRoute } from './hooks/useRoute';
import { ToastProvider } from './hooks/ToastContext';
import { WormholeFallback } from './components/ui/WormholeFallback';

const SpaceBackground = lazy(() => import('./components/layout/SpaceBackground').then(({ SpaceBackground }) => ({ default: SpaceBackground })));
const Login = lazy(() => import('./pages/Login').then(({ Login }) => ({ default: Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const Focus = lazy(() => import('./pages/Focus').then(({ Focus }) => ({ default: Focus })));
const Habits = lazy(() => import('./pages/Habits').then(({ Habits }) => ({ default: Habits })));
const Analytics = lazy(() => import('./pages/Analytics').then(({ Analytics }) => ({ default: Analytics })));
const Templates = lazy(() => import('./pages/Templates').then(({ Templates }) => ({ default: Templates })));
const Settings = lazy(() => import('./pages/Settings').then(({ Settings }) => ({ default: Settings })));
const SessionComplete = lazy(() => import('./pages/SessionComplete').then(({ SessionComplete }) => ({ default: SessionComplete })));

function ThemeEffects() {
  const { theme } = useTheme();
  return theme === 'interstellar' ? (
    <Suspense fallback={null}><SpaceBackground /></Suspense>
  ) : null;
}

function Screens() {
  const page = useRoute();
  const screen = (() => {
    switch (page) {
      case 'focus': return <Focus />;
      case 'habits': return <Habits />;
      case 'analytics': return <Analytics />;
      case 'templates': return <Templates />;
      case 'settings': return <Settings />;
      case 'complete': return <SessionComplete />;
      default: return <Dashboard />;
    }
  })();

  return (
    <Suspense fallback={<WormholeFallback label="Opening your next orbit…" />}>
      <div key={page} className={`route-warp route-warp--${page}`}>{screen}</div>
    </Suspense>
  );
}

function Gate() {
  const { user, profile, loading } = useAuth();
  if (loading) return <WormholeFallback fullScreen showLogo label="Loading your workspace…" />;
  if (!user || !profile) {
    return (
      <Suspense fallback={<WormholeFallback fullScreen label="Preparing sign in…" />}>
        <Login />
      </Suspense>
    );
  }
  return <TimerProvider><Screens /></TimerProvider>;
}

function AppContent() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeEffects />
        <Gate />
      </AuthProvider>
    </ToastProvider>
  );
}

export default function App() {
  return <ThemeProvider><AppContent /></ThemeProvider>;
}
