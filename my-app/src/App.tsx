import { AuthProvider, useAuth } from './hooks/useAuth';
import { TimerProvider } from './hooks/TimerContext';
import { useRoute } from './hooks/useRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Focus } from './pages/Focus';
import { Habits } from './pages/Habits';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { SessionComplete } from './pages/SessionComplete';

function Screens() {
  const page = useRoute();
  switch (page) {
    case 'focus': return <Focus />;
    case 'habits': return <Habits />;
    case 'analytics': return <Analytics />;
    case 'settings': return <Settings />;
    case 'complete': return <SessionComplete />;
    default: return <Dashboard />;
  }
}

function Gate() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-app-primary text-app-white">Loading…</div>;
  if (!user || !profile) return <Login />;
  return <TimerProvider><Screens /></TimerProvider>;
}

export default function App() {
  return <AuthProvider><Gate /></AuthProvider>;
}
