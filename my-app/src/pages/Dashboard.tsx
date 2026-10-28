import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { FocusTimer } from '../components/focus/FocusTimer';
import { TimerControls } from '../components/focus/TimerControls';
import { HabitList } from '../components/habits/HabitList';
import { StatsCard } from '../components/analytics/StatsCard';
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/TimerContext';
import { useHabits } from '../hooks/useHabits';
import { useAnalytics } from '../hooks/useAnalytics';
import { SessionPicker } from '../components/focus/SessionPicker';
import { buildSuggestions } from '../lib/utils';

export function Dashboard() {
  const { profile } = useAuth();
  const t = useTimer();
  const habits = useHabits();
  const stats = useAnalytics(7);
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const first = (profile?.displayName ?? '').split(' ')[0];
  const suggestions = buildSuggestions(habits.habits.map((h) => h.name), stats.recent.map((r) => r.subject));

  return (
    <AppLayout active="dashboard" title={`Good ${part}, ${first}`}>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-6">
            <FocusTimer variant="ring" remainingMs={t.remainingMs} totalMs={t.totalMs} label={t.mode === 'focus' ? 'Focus timer' : 'Break timer'} />
            <div className="flex min-w-[180px] flex-1 flex-col gap-3">
              <h2 className="text-xl font-bold">{t.mode === 'focus' ? 'Ready to focus?' : 'Break time'}</h2>
              <p className="text-sm text-[#6B7C93]">Name your session or tap one of your habits.</p>
              <SessionPicker id="dash-session" value={t.subject} onChange={t.setSubject} suggestions={suggestions} disabled={t.status !== 'idle'} />
              <TimerControls status={t.status} mode={t.mode} canReset={t.status !== 'idle' || t.remainingMs !== t.totalMs}
                onStart={t.start} onPause={t.pause} onReset={t.reset} onSkipBreak={t.skipBreak} />
            </div>
          </div>
        </Card>
        <Card className="lg:col-span-2" title="Today's habits" action={<span className="text-sm font-bold text-[#32CC59]">{habits.doneCount}/{habits.total}</span>}>
          {habits.loading ? <p className="text-sm text-[#6B7C93]">Loading…</p> : (
            <>
              <ProgressBar value={habits.progress} label="Habits completed today" />
              <div className="mt-2"><HabitList habits={habits.habits} onToggle={(id) => void habits.toggleHabit(id)} /></div>
            </>
          )}
          {habits.error && <p role="alert" className="mt-2 text-sm text-red-600">{habits.error}</p>}
        </Card>
      </div>
      <Card className="mt-4">
        {stats.error ? <p role="alert" className="text-sm text-red-600">{stats.error}</p> : (
          <div className="flex flex-wrap gap-6">
            <StatsCard label="Current streak" value={`${stats.streak} days`} />
            <StatsCard label="Focused today" value={`${stats.todayMin} min`} />
            <StatsCard label="Sessions today" value={stats.todayCount} />
          </div>
        )}
      </Card>
    </AppLayout>
  );
}