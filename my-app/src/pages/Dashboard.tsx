import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { FocusTimer } from '../components/focus/FocusTimer';
import { TimerControls } from '../components/focus/TimerControls';
import { HabitList } from '../components/habits/HabitList';
import { StatsCard } from '../components/analytics/StatsCard';
import { useAuth } from '../hooks/useAuthContext';
import { useTimer } from '../hooks/useTimer';
import { useHabits } from '../hooks/useHabits';
import { useAnalytics } from '../hooks/useAnalytics';
import { SessionPicker } from '../components/focus/SessionPicker';
import { buildSuggestions } from '../lib/utils';
import { Activity, Flame, Repeat, Timer } from 'lucide-react';

export function Dashboard() {
  const [now, setNow] = useState(() => new Date());
  const { profile } = useAuth();
  const t = useTimer();
  const habits = useHabits();
  const stats = useAnalytics(7);
  const hour = now.getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const first = profile?.firstName || (profile?.displayName ?? '').split(' ')[0];
  const suggestions = buildSuggestions(habits.habits.map((h) => h.name), stats.recent.map((r) => r.subject));

  useEffect(() => {
    const current = new Date();
    const next = new Date(current);
    if (current.getHours() < 12) next.setHours(12, 0, 0, 0);
    else if (current.getHours() < 18) next.setHours(18, 0, 0, 0);
    else {
      next.setDate(next.getDate() + 1);
      next.setHours(12, 0, 0, 0);
    }
    const timeout = window.setTimeout(() => setNow(new Date()), next.getTime() - current.getTime());
    return () => window.clearTimeout(timeout);
  }, [now]);

  return (
    <AppLayout active="dashboard" title={`Good ${part}, ${first}`}>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-6">
            <FocusTimer variant="ring" remainingMs={t.remainingMs} totalMs={t.totalMs} label={t.mode === 'focus' ? 'Focus timer' : 'Break timer'} running={t.status === 'running'} />
            <div className="flex min-w-[180px] flex-1 flex-col gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold"><Timer size={18} strokeWidth={2} aria-hidden="true" />{t.mode === 'focus' ? 'Ready to focus?' : 'Break time'}</h2>
              <p className="text-sm text-app-muted">Name your session or tap one of your habits.</p>
              <SessionPicker id="dash-session" value={t.subject} onChange={t.setSubject} suggestions={suggestions} disabled={t.status !== 'idle'} />
              <TimerControls status={t.status} mode={t.mode} canReset={t.status !== 'idle' || t.remainingMs !== t.totalMs}
                onStart={t.start} onPause={t.pause} onReset={t.reset} onSkipBreak={t.skipBreak} />
            </div>
          </div>
        </Card>
        <Card className="lg:col-span-2" title="Today's habits" titleIcon={<Repeat size={16} strokeWidth={2} aria-hidden="true" />} action={<span className="text-sm font-bold text-app-success">{habits.doneCount}/{habits.total}</span>}>
          {habits.loading ? <p className="text-sm text-app-muted">Loading…</p> : (
            <>
              <ProgressBar value={habits.progress} label="Habits completed today" />
              <div className="mt-2"><HabitList habits={habits.habits} onToggle={(id) => void habits.toggleHabit(id)} /></div>
            </>
          )}
          {habits.error && <p role="alert" className="mt-2 text-sm text-app-danger">{habits.error}</p>}
        </Card>
      </div>
      <Card className="mt-4">
        {stats.error ? <p role="alert" className="text-sm text-app-danger">{stats.error}</p> : (
          <div className="flex flex-wrap gap-6">
            <StatsCard label="Current streak" value={`${stats.streak} days`} icon={<Flame size={14} strokeWidth={2} aria-hidden="true" />} />
            <StatsCard label="Focused today" value={`${stats.todayMin} min`} icon={<Timer size={14} strokeWidth={2} aria-hidden="true" />} />
            <StatsCard label="Sessions today" value={stats.todayCount} icon={<Activity size={14} strokeWidth={2} aria-hidden="true" />} />
          </div>
        )}
      </Card>
    </AppLayout>
  );
}