import { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { StatsCard } from '../components/analytics/StatsCard';
import { FocusChart } from '../components/analytics/FocusChart';
import { useAnalytics } from '../hooks/useAnalytics';
import { dateKey, formatMinutes } from '../lib/utils';

export function Analytics() {
  const [range, setRange] = useState<7 | 30>(7);
  const a = useAnalytics(range);
  const pill = (on: boolean) => `rounded-full px-3 py-1 text-xs ${on ? 'bg-app-white text-app-navy' : 'bg-app-white/20 text-app-white hover:bg-app-white/30'}`;
  const actions = (
    <>
      <button type="button" className={pill(range === 7)} onClick={() => setRange(7)}>Last 7 days</button>
      <button type="button" className={pill(range === 30)} onClick={() => setRange(30)}>Last 30 days</button>
    </>
  );
  return (
    <AppLayout active="analytics" title="Analytics" actions={actions}>
      {a.loading ? <Card><p className="text-sm text-app-muted">Loading…</p></Card> : a.error ? <Card><p role="alert" className="text-sm text-app-danger">{a.error}</p></Card> : (
        <>
          <Card>
            <div className="flex flex-wrap gap-6">
              <StatsCard label="Focus time" value={formatMinutes(a.focusMin)} />
              <StatsCard label="Sessions" value={a.sessionCount} />
              <StatsCard label="Habits done" value={`${a.habitsDone} / ${a.habitsPossible}`} />
              <StatsCard label="Completion rate" value={`${a.completionRate}%`} />
              <StatsCard label="Streak" value={`${a.streak} days`} />
            </div>
          </Card>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Daily focus" action={<span className="text-[11px] text-app-muted">minutes</span>}>
              {a.focusMin === 0 ? <p className="text-sm text-app-muted">No finished sessions in this range yet.</p> : <FocusChart data={a.daily} />}
            </Card>
            <Card title="Recent sessions">
              {a.recent.length === 0 ? <p className="text-sm text-app-muted">Nothing logged yet.</p> : (
                <ul>
                  {a.recent.map((s) => (
                    <li key={s.id} className="flex justify-between border-b border-app-border py-2 text-sm last:border-0">
                      <span className="font-bold">{s.subject}</span>
                      <span className="text-[11px] text-app-muted">{s.durationMin} m · {dateKey(new Date(s.completedAt)) === dateKey() ? 'today' : new Date(s.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    </li>
                  ))}
                </ul>
              )}
              {a.bestDayMin > 0 && <span className="mt-3 inline-block rounded-full bg-app-highlight px-3 py-1 text-xs">Best day: {formatMinutes(a.bestDayMin)}</span>}
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
}
