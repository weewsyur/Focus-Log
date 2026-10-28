import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTimer } from '../hooks/TimerContext';
import { useHabits } from '../hooks/useHabits';
import { useAnalytics } from '../hooks/useAnalytics';
import { navigate } from '../hooks/useRoute';
import { dateKey } from '../lib/utils';

export function SessionComplete() {
  const t = useTimer();
  const habits = useHabits();
  const stats = useAnalytics(7);
  const s = t.lastSession;
  const left = habits.habits.filter((h) => !h.doneToday).map((h) => h.name);
  const row = (k: string, v: string | number) => (
    <div className="flex justify-between border-b border-[#E3EAF3] py-2.5 text-sm last:border-0"><span>{k}</span><span className="text-[#6B7C93]">{v}</span></div>
  );

  if (!s && !t.saveError) {
    return (
      <AppLayout active="complete" title="Session complete">
        <Card className="text-center">
          <p className="mb-4 text-sm text-[#6B7C93]">No finished session to show yet.</p>
          <Button onClick={() => navigate('focus')}>Go to focus timer</Button>
        </Card>
      </AppLayout>
    );
  }
  return (
    <AppLayout active="complete" title="Session complete">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="py-10">
          {s && !stats.loading && !stats.error && stats.bestSessionMin === s.durationMin && <span className="rounded-full bg-[#FFF1A8] px-3 py-1 text-xs">New daily best: {stats.todayMin} minutes</span>}
          <p className="my-5 text-7xl font-bold leading-none tabular-nums">{String(s?.durationMin ?? t.focusMin).padStart(2, '0')}:00</p>
          {t.saveError
            ? <p role="alert" className="mb-4 text-sm text-red-600">We couldn't save this session: {t.saveError}</p>
            : <p className="mb-5">{s?.subject} session saved. Take {t.breakMin} minutes, then go again.</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { t.startBreak(); navigate('focus'); }}>Start {t.breakMin} min break</Button>
            <Button variant="ghost" onClick={() => { t.skipBreak(); navigate('focus'); }}>Skip break</Button>
          </div>
          {stats.loading ? <p className="mt-4 text-sm text-[#6B7C93]">Loading statistics…</p> : stats.error ? <p role="alert" className="mt-4 text-sm text-red-600">{stats.error}</p> : null}
        </Card>
        <Card title="Saved to your log">
          {s ? (
            <>
              {row('Subject', s.subject)}{row('Duration', `${s.durationMin} min`)}{row('Date', dateKey(new Date(s.completedAt)))}
              {stats.loading ? <p className="py-2 text-sm text-[#6B7C93]">Loading statistics…</p> : stats.error ? <p role="alert" className="py-2 text-sm text-red-600">{stats.error}</p> : (
                <>{row('Sessions today', stats.todayCount)}{row('Focus today', `${stats.todayMin} min`)}</>
              )}
            </>
          ) : <p className="text-sm text-[#6B7C93]">Nothing was saved.</p>}
          <p className="mt-4 text-[11px] uppercase tracking-wider text-[#6B7C93]">Habits left today</p>
          {habits.loading ? <p className="text-sm text-[#6B7C93]">Loading habits…</p> : habits.error ? <p role="alert" className="text-sm text-red-600">{habits.error}</p> : (
            <p className="text-sm font-bold">{left.length ? `${left.length} unchecked — ${left.join(', ')}` : 'All done. Nice.'}</p>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
