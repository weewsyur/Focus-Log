import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { HabitList } from '../components/habits/HabitList';
import { HabitForm } from '../components/habits/HabitForm';
import { useHabits } from '../hooks/useHabits';
import { useAnalytics } from '../hooks/useAnalytics';
import { dateKey, lastNDays } from '../lib/utils';

export function Habits() {
  const h = useHabits();
  const stats = useAnalytics(7);
  const title = `Habits · ${new Date().toLocaleDateString('en', { weekday: 'short', day: '2-digit', month: 'short' })}`;
  return (
    <AppLayout active="habits" title={title}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Today" action={<span className="text-sm font-bold text-[#32CC59]">{h.doneCount}/{h.total} done</span>}>
          {h.loading ? <p className="text-sm text-[#6B7C93]">Loading…</p> : (
            <>
              <ProgressBar value={h.progress} label="Habits completed today" />
              <div className="mt-2">
                <HabitList habits={h.habits} onToggle={(id) => void h.toggleHabit(id)}
                  onRename={(id, n) => void h.renameHabit(id, n)} onDelete={(id) => void h.deleteHabit(id)} />
              </div>
            </>
          )}
          {h.error && <p role="alert" className="mt-2 text-sm text-red-600">{h.error}</p>}
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-[11px] uppercase tracking-wider text-[#6B7C93]">Current streak</p>
            <p className="text-6xl font-bold">{stats.streak}</p>
            <p className="text-xs text-[#6B7C93]">days in a row · best {stats.bestStreak}</p>
            <div className="mt-3 flex gap-1">
              {lastNDays(7).map((d) => {
                const on = stats.activeDates.has(dateKey(d));
                return <span key={dateKey(d)} title={dateKey(d)} className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${on ? 'bg-[#32CC59] text-white' : 'bg-[#DCEBFA]'}`}>{'SMTWTFS'[d.getDay()]}</span>;
              })}
            </div>
          </Card>
          <Card title="Add a habit"><HabitForm onAdd={h.addHabit} /></Card>
        </div>
      </div>
    </AppLayout>
  );
}
