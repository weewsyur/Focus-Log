import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Stepper } from '../components/ui/Stepper';
import { FocusTimer } from '../components/focus/FocusTimer';
import { TimerControls } from '../components/focus/TimerControls';
import { useTimer } from '../hooks/TimerContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { SUBJECTS } from '../lib/utils';

export function Focus() {
  const t = useTimer();
  const stats = useAnalytics(7);
  const idle = t.status === 'idle';
  const slots = Math.max(4, stats.todayCount);
  const label = t.mode === 'focus' ? `${t.subject} · session ${stats.todayCount + 1} today` : 'Break time';

  return (
    <AppLayout active="focus" title="Focus">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="py-10 lg:col-span-2">
          <FocusTimer remainingMs={t.remainingMs} totalMs={t.totalMs} label={label} />
          <TimerControls status={t.status} mode={t.mode} canReset={!idle || t.remainingMs !== t.totalMs}
            onStart={t.start} onPause={t.pause} onReset={t.reset} onSkipBreak={t.skipBreak} />
          <div className="mt-10 flex justify-around text-xs uppercase tracking-wider text-[#6B7C93]">
            {stats.loading ? <span>Loading statistics…</span> : stats.error ? <span role="alert" className="text-red-600">{stats.error}</span> : (
              <><span>Mean {stats.meanSessionMin} min</span><span>Today {stats.todayMin} min</span><span>Best {stats.bestSessionMin} min</span></>
            )}
          </div>
        </Card>
        <Card>
          <label className="text-xs uppercase tracking-wider text-[#6B7C93]" htmlFor="subject">Subject</label>
          <select id="subject" value={t.subject} onChange={(e) => t.setSubject(e.target.value)} disabled={!idle}
            className="mb-5 mt-1 w-full rounded-lg border border-[#E3EAF3] px-3 py-2 text-sm disabled:opacity-60">
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="mb-3 flex items-center justify-between text-sm font-bold">Focus
            <Stepper label="focus length" value={t.focusMin} min={1} max={180} disabled={!idle} onChange={(v) => t.setDurations(v, t.breakMin)} /></div>
          <div className="mb-5 flex items-center justify-between text-sm font-bold">Break
            <Stepper label="break length" value={t.breakMin} min={1} max={60} disabled={!idle} onChange={(v) => t.setDurations(t.focusMin, v)} /></div>
          <hr className="border-[#E3EAF3]" />
          <p className="mt-4 text-xs uppercase tracking-wider text-[#6B7C93]">Sessions today</p>
          {stats.loading ? <p className="text-sm text-[#6B7C93]">Loading…</p> : stats.error ? <p role="alert" className="text-sm text-red-600">{stats.error}</p> : (
            <>
              <p className="text-4xl font-bold">{stats.todayCount}</p>
              <div className="mt-2 flex gap-1" aria-hidden="true">
                {Array.from({ length: slots }, (_, i) => <span key={i} className={`h-4 w-4 rounded-full ${i < stats.todayCount ? 'bg-[#32CC59]' : 'bg-[#DCEBFA]'}`} />)}
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-[#6B7C93]">Closing this tab mid-session discards it. Only finished sessions are saved.</p>
        </Card>
      </div>
    </AppLayout>
  );
}
