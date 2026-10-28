import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { focusSessionService } from '../services/focusSessionService';
import { habitService } from '../services/habitService';
import type { DailyPoint, FocusSession, HabitLog } from '../types';
import { computeBestStreak, computeStreak, dateKey, errMsg, lastNDays } from '../lib/utils';

export function useAnalytics(rangeDays: 7 | 30 = 7) {
  const { user } = useAuth();
  const userId = user?.id;
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [habitCount, setHabitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [s, l, h] = await Promise.all([focusSessionService.list(userId), habitService.logs(userId), habitService.list(userId)]);
        if (!cancelled) { setSessions(s); setLogs(l); setHabitCount(h.length); setError(null); }
      } catch (e) { if (!cancelled) setError(errMsg(e)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const data = useMemo(() => {
    const days = lastNDays(rangeDays);
    const keys = days.map((d) => dateKey(d));
    const keySet = new Set(keys);
    const dayOf = (s: FocusSession) => dateKey(new Date(s.completedAt));
    const byDay = new Map<string, number>();
    sessions.forEach((s) => byDay.set(dayOf(s), (byDay.get(dayOf(s)) ?? 0) + s.durationMin));

    const inRange = sessions.filter((s) => keySet.has(dayOf(s)));
    const daily: DailyPoint[] = days.map((d) => ({
      date: dateKey(d),
      label: rangeDays <= 7 ? d.toLocaleDateString('en', { weekday: 'short' }) : String(d.getDate()),
      minutes: byDay.get(dateKey(d)) ?? 0,
    }));
    const habitsDone = logs.filter((l) => keySet.has(l.date)).length;
    const habitsPossible = habitCount * keys.length;

    const active = new Set<string>([...logs.map((l) => l.date), ...sessions.map(dayOf)]);
    const today = dateKey();
    const todaySessions = sessions.filter((s) => dayOf(s) === today);
    const all = sessions.map((s) => s.durationMin);
    return {
      focusMin: inRange.reduce((a, s) => a + s.durationMin, 0),
      sessionCount: inRange.length,
      habitsDone, habitsPossible,
      completionRate: habitsPossible ? Math.round((habitsDone / habitsPossible) * 100) : 0,
      daily,
      bestDayMin: Math.max(0, ...daily.map((d) => d.minutes)),
      recent: sessions.slice(0, 6),
      activeDates: active,
      streak: computeStreak(active),
      bestStreak: computeBestStreak(active),
      todayMin: todaySessions.reduce((a, s) => a + s.durationMin, 0),
      todayCount: todaySessions.length,
      bestSessionMin: Math.max(0, ...all),
      meanSessionMin: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0,
    };
  }, [sessions, logs, habitCount, rangeDays]);

  return { ...data, loading, error };
}
