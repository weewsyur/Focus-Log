import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { HabitList } from '../components/habits/HabitList';
import { HabitForm } from '../components/habits/HabitForm';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useAnalytics } from '../hooks/useAnalytics';
import { dateKey, lastNDays } from '../lib/utils';
import { CalendarDays, Flame, Plus, Repeat } from 'lucide-react';

export function Habits() {
  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const h = useHabits();
  const stats = useAnalytics(7);
  const title = `Habits · ${new Date().toLocaleDateString('en', { weekday: 'short', day: '2-digit', month: 'short' })}`;
  return (
    <AppLayout active="habits" title={title}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Today" titleIcon={<CalendarDays size={16} strokeWidth={2} aria-hidden="true" />} action={<span className="text-sm font-bold text-app-success">{h.doneCount}/{h.total} done</span>}>
          {h.loading ? <p className="text-sm text-app-muted">Loading…</p> : (
            <>
              <ProgressBar value={h.progress} label="Habits completed today" />
              <div className="mt-2">
                <HabitList habits={h.habits} onToggle={(id) => void h.toggleHabit(id)}
                        onRename={h.renameHabit} onDelete={h.deleteHabit} />
              </div>
            </>
          )}
          {h.error && <p role="alert" className="mt-2 text-sm text-app-danger">{h.error}</p>}
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-app-muted"><Flame size={14} strokeWidth={2} aria-hidden="true" />Current streak</p>
            <p className="text-6xl font-bold">{stats.streak}</p>
            <p className="text-xs text-app-muted">days in a row · best {stats.bestStreak}</p>
            <div className="mt-3 flex gap-1">
              {lastNDays(7).map((d) => {
                const on = stats.activeDates.has(dateKey(d));
                return <span key={dateKey(d)} title={dateKey(d)} className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${on ? 'bg-app-success text-app-white' : 'bg-app-blue-soft'}`}>{'SMTWTFS'[d.getDay()]}</span>;
              })}
            </div>
          </Card>
          <Card title="Build your routine" titleIcon={<Repeat size={16} strokeWidth={2} aria-hidden="true" />} action={<Button size="sm" icon={<Plus size={14} strokeWidth={2} aria-hidden="true" />} onClick={() => setAddOpen(true)}>Add habit</Button>}>
            <p className="text-sm text-app-muted">Add a habit you want to keep up with each day.</p>
          </Card>
        </div>
      </div>
      {addOpen && (
        <Modal title="Add a habit" onClose={() => { if (!addBusy) setAddOpen(false); }}>
          <HabitForm onAdd={h.addHabit} onAdded={() => setAddOpen(false)} onBusyChange={setAddBusy} />
        </Modal>
      )}
    </AppLayout>
  );
}
