import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTimer } from '../hooks/TimerContext';
import { useHabits } from '../hooks/useHabits';
import { useAnalytics } from '../hooks/useAnalytics';
import { navigate } from '../hooks/useRoute';
import { dateKey } from '../lib/utils';
import { Award, Coffee, SkipForward, Timer } from 'lucide-react';
import { Confirmation } from '../components/ui/Confirmation';

export function SessionComplete() {
  const t = useTimer();
  const habits = useHabits();
  const stats = useAnalytics(7);
  const s = t.lastSession;
  const pending = t.pendingSession;
  const displayedSubject = s?.subject ?? pending?.subject ?? '';
  const displayedDuration = s?.durationMin ?? pending?.durationMin ?? t.focusMin;
  const left = habits.habits.filter((h) => !h.doneToday).map((h) => h.name);
  const row = (k: string, v: string | number) => (
    <div className="flex justify-between border-b border-app-border py-2.5 text-sm last:border-0"><span>{k}</span><span className="text-app-muted">{v}</span></div>
  );

  if (!s && !pending && !t.saveError) {
    return (
      <AppLayout active="complete" title="Session complete">
        <Card className="text-center">
          <p className="mb-4 text-sm text-app-muted">No finished session to show yet.</p>
          <Button icon={<Timer size={16} strokeWidth={2} aria-hidden="true" />} onClick={() => navigate('focus')}>Go to focus timer</Button>
        </Card>
      </AppLayout>
    );
  }
  return (
    <AppLayout active="complete" title="Session complete">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="py-10">
          {s && !stats.loading && !stats.error && stats.bestSessionMin === s.durationMin && <span className="inline-flex items-center gap-1.5 rounded-full bg-app-highlight px-3 py-1 text-xs"><Award size={14} strokeWidth={2} aria-hidden="true" />New daily best: {stats.todayMin} minutes</span>}
          <p className="my-5 text-7xl font-bold leading-none tabular-nums">{String(displayedDuration).padStart(2, '0')}:00</p>
          {t.saveError
            ? <p role="alert" className="mb-4 text-sm text-app-danger">We couldn't save this session: {t.saveError}</p>
            : <p className="mb-5">{s ? `${s.subject} session saved.` : `${displayedSubject} is ready to save.`} Take {t.breakMin} minutes, then go again.</p>}
          <div className="flex flex-wrap gap-2">
            <Button icon={<Coffee size={16} strokeWidth={2} aria-hidden="true" />} onClick={() => { t.startBreak(); navigate('focus'); }}>Start {t.breakMin} min break</Button>
            <Button variant="ghost" icon={<SkipForward size={15} strokeWidth={2} aria-hidden="true" />} onClick={() => { t.skipBreak(); navigate('focus'); }}>Skip break</Button>
          </div>
          {stats.loading ? <p className="mt-4 text-sm text-app-muted">Loading statistics…</p> : stats.error ? <p role="alert" className="mt-4 text-sm text-app-danger">{stats.error}</p> : null}
        </Card>
        <Card title={s ? 'Saved to your log' : 'Session details'} titleIcon={<Award size={16} strokeWidth={2} aria-hidden="true" />}>
          {s || pending ? (
            <>
              {row('Subject', displayedSubject)}{row('Duration', `${displayedDuration} min`)}
              {s && row('Date', dateKey(new Date(s.completedAt)))}
              {s && stats.loading ? <p className="py-2 text-sm text-app-muted">Loading statistics…</p> : s && stats.error ? <p role="alert" className="py-2 text-sm text-app-danger">{stats.error}</p> : s ? (
                <>{row('Sessions today', stats.todayCount)}{row('Focus today', `${stats.todayMin} min`)}</>
              ) : <p className="py-2 text-sm text-app-muted">This session has not been saved yet.</p>}
            </>
          ) : <p className="text-sm text-app-muted">Nothing was saved.</p>}
          <p className="mt-4 text-[11px] uppercase tracking-wider text-app-muted">Habits left today</p>
          {habits.loading ? <p className="text-sm text-app-muted">Loading habits…</p> : habits.error ? <p role="alert" className="text-sm text-app-danger">{habits.error}</p> : (
            <p className="text-sm font-bold">{left.length ? `${left.length} unchecked — ${left.join(', ')}` : 'All done. Nice.'}</p>
          )}
        </Card>
      </div>
      {pending && (
        <Confirmation
          title="Save completed session?"
          message={<>Are you sure you want to save the <strong className="text-app-navy">{pending.subject}</strong> session ({pending.durationMin} minutes) to your log?</>}
          busy={t.savingSession}
          confirmLabel="Yes, save session"
          onCancel={t.discardPendingSession}
          onConfirm={() => { void t.saveSession().catch(() => undefined); }}
        />
      )}
    </AppLayout>
  );
}
