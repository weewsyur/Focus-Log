import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { StatsCard } from '../components/analytics/StatsCard';
import { FocusChart } from '../components/analytics/FocusChart';
import { useAnalytics, type AnalyticsRange } from '../hooks/useAnalytics';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { dateKey, formatMinutes, lastNDays, readLocal, writeLocal } from '../lib/utils';
import { Activity, CalendarDays, CheckCircle2, Clock3, Flame, Repeat, Timer } from 'lucide-react';

type RangeMode = '7' | '30' | 'custom';
interface SavedRange {
  mode: RangeMode;
  startDate: string;
  endDate: string;
  applied: AnalyticsRange;
}
const RANGE_KEY = 'focuslog.analyticsRange';
const DEFAULT_RANGE: SavedRange = { mode: '7', startDate: '', endDate: '', applied: 7 };
const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(new Date(`${value}T00:00:00`)) === value;

export function Analytics() {
  const [savedRange, setSavedRange] = useState(() => readLocal<SavedRange>(RANGE_KEY, DEFAULT_RANGE));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const a = useAnalytics(savedRange.applied);
  const today = dateKey();
  const bounds = typeof savedRange.applied === 'number'
    ? { startDate: dateKey(lastNDays(savedRange.applied)[0]), endDate: today }
    : savedRange.applied;
  const history = useSessionHistory(bounds.startDate, bounds.endDate, page, pageSize);
  useEffect(() => { writeLocal(RANGE_KEY, savedRange); }, [savedRange]);
  const updateRange = (mode: RangeMode) => {
    setRangeError(null);
    if (mode === '7' || mode === '30') {
      setSavedRange((current) => ({ ...current, mode, applied: Number(mode) as 7 | 30 }));
      setPage(1);
    } else {
      setSavedRange((current) => ({ ...current, mode }));
    }
  };
  const applyCustomRange = () => {
    const { startDate, endDate } = savedRange;
    if (!startDate || !endDate) { setRangeError('Choose both a start date and an end date.'); return; }
    if (!isDateKey(startDate) || !isDateKey(endDate)) { setRangeError('Choose valid dates.'); return; }
    if (startDate > today || endDate > today) { setRangeError('Dates in the future are not available.'); return; }
    if (endDate < startDate) { setRangeError('End date cannot be before the start date.'); return; }
    setRangeError(null);
    setSavedRange((current) => ({ ...current, mode: 'custom', applied: { startDate, endDate } }));
    setPage(1);
  };
  const pill = (on: boolean) => `rounded-full px-3 py-1 text-xs ${on ? 'bg-app-white text-app-navy' : 'bg-app-white/20 text-app-white hover:bg-app-white/30'}`;
  const actions = (
    <>
      <button type="button" aria-pressed={savedRange.mode === '7'} className={`${pill(savedRange.mode === '7')} inline-flex items-center gap-1.5`} onClick={() => updateRange('7')}><CalendarDays size={14} strokeWidth={2} aria-hidden="true" />Last 7 days</button>
      <button type="button" aria-pressed={savedRange.mode === '30'} className={`${pill(savedRange.mode === '30')} inline-flex items-center gap-1.5`} onClick={() => updateRange('30')}><CalendarDays size={14} strokeWidth={2} aria-hidden="true" />Last 30 days</button>
      <button type="button" aria-pressed={savedRange.mode === 'custom'} className={`${pill(savedRange.mode === 'custom')} inline-flex items-center gap-1.5`} onClick={() => updateRange('custom')}><CalendarDays size={14} strokeWidth={2} aria-hidden="true" />Custom Date Range</button>
    </>
  );
  const totalPages = Math.max(1, Math.ceil(history.total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageSessions = history.sessions;
  return (
    <AppLayout active="analytics" title="Analytics" actions={actions}>
      {savedRange.mode === 'custom' && (
        <Card className="mb-4" title="Custom Date Range" titleIcon={<CalendarDays size={16} strokeWidth={2} aria-hidden="true" />}>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">Start Date
              <input aria-label="Start Date" type="date" max={today} value={savedRange.startDate}
                onChange={(event) => { setRangeError(null); setSavedRange((current) => ({ ...current, startDate: event.target.value })); }}
                className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">End Date
              <input aria-label="End Date" type="date" min={savedRange.startDate || undefined} max={today} value={savedRange.endDate}
                onChange={(event) => { setRangeError(null); setSavedRange((current) => ({ ...current, endDate: event.target.value })); }}
                className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            <button type="button" onClick={applyCustomRange} className="rounded-full bg-app-primary px-4 py-2 text-sm font-bold text-app-white hover:brightness-95">Apply range</button>
          </div>
          {rangeError && <p role="alert" className="mt-2 text-sm text-app-danger">{rangeError}</p>}
          {typeof savedRange.applied !== 'number' && <p className="mt-2 text-xs text-app-muted">Showing {savedRange.applied.startDate} through {savedRange.applied.endDate} until you apply a new range.</p>}
        </Card>
      )}
      {a.loading || history.loading ? <Card><p className="text-sm text-app-muted">Loading…</p></Card> : a.error || history.error ? <Card><p role="alert" className="text-sm text-app-danger">{a.error || history.error}</p></Card> : (
        <>
          <Card>
            <div className="flex flex-wrap gap-6">
              <StatsCard label="Focus time" value={formatMinutes(a.focusMin)} icon={<Timer size={14} strokeWidth={2} aria-hidden="true" />} />
              <StatsCard label="Sessions" value={a.sessionCount} icon={<Activity size={14} strokeWidth={2} aria-hidden="true" />} />
              <StatsCard label="Habits done" value={`${a.habitsDone} / ${a.habitsPossible}`} icon={<Repeat size={14} strokeWidth={2} aria-hidden="true" />} />
              <StatsCard label="Completion rate" value={`${a.completionRate}%`} icon={<CheckCircle2 size={14} strokeWidth={2} aria-hidden="true" />} />
              <StatsCard label="Best streak in range" value={`${a.rangeStreak} days`} icon={<Flame size={14} strokeWidth={2} aria-hidden="true" />} />
            </div>
          </Card>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Daily focus" titleIcon={<Clock3 size={16} strokeWidth={2} aria-hidden="true" />} action={<span className="text-[11px] text-app-muted">minutes</span>}>
              {a.focusMin === 0 ? <p className="text-sm text-app-muted">No finished sessions in this range yet.</p> : <FocusChart data={a.daily} />}
            </Card>
            <Card title="Recent sessions" titleIcon={<Activity size={16} strokeWidth={2} aria-hidden="true" />}>
              {history.total === 0 ? <p className="text-sm text-app-muted">No sessions in this range yet.</p> : (
                <>
                  <ul>
                    {pageSessions.map((s) => (
                      <li key={s.id} className="flex justify-between gap-3 border-b border-app-border py-2 text-sm last:border-0">
                        <span className="font-bold">{s.subject}</span>
                        <span className="shrink-0 text-[11px] text-app-muted">{s.durationMin} m · {dateKey(new Date(s.completedAt)) === today ? 'today' : new Date(s.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-app-muted">
                    <span>{history.total} sessions · Page {currentPage} of {totalPages}</span>
                    <label className="flex items-center gap-1">Per page
                      <select aria-label="Sessions per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded border border-app-border bg-app-white px-1 py-1 text-app-navy">
                        <option value={10}>10</option><option value={20}>20</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} className="rounded-full border border-app-border px-3 py-1 text-xs font-bold text-app-navy disabled:opacity-40">Previous</button>
                    <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages} className="rounded-full border border-app-border px-3 py-1 text-xs font-bold text-app-navy disabled:opacity-40">Next</button>
                  </div>
                </>
              )}
              {a.bestDayMin > 0 && <span className="mt-3 inline-block rounded-full bg-app-highlight px-3 py-1 text-xs">Best day: {formatMinutes(a.bestDayMin)}</span>}
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  );
}
