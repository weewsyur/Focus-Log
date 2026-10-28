import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { habitService } from '../services/habitService';
import type { Habit, HabitLog, HabitWithStatus } from '../types';
import { computeStreak, dateKey, errMsg } from '../lib/utils';

export function useHabits() {
  const { user } = useAuth();
  const userId = user?.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [h, l] = await Promise.all([habitService.list(userId), habitService.logs(userId)]);
      setHabits(h); setLogs(l); setError(null);
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { void load(); }, [load]);

  const addHabit = useCallback(async (name: string) => {
    if (!userId) return;
    try { const h = await habitService.create(userId, name); setHabits((p) => [...p, h]); setError(null); }
    catch (e) { setError(errMsg(e)); }
  }, [userId]);

  const renameHabit = useCallback(async (id: string, name: string) => {
    if (!userId) return;
    try { await habitService.rename(userId, id, name); setHabits((p) => p.map((h) => (h.id === id ? { ...h, name } : h))); setError(null); }
    catch (e) { setError(errMsg(e)); }
  }, [userId]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!userId) return;
    try {
      await habitService.remove(userId, id);
      setHabits((p) => p.filter((h) => h.id !== id));
      setLogs((p) => p.filter((l) => l.habitId !== id));
      setError(null);
    } catch (e) { setError(errMsg(e)); }
  }, [userId]);

  const toggleHabit = useCallback(async (id: string) => {
    if (!userId) return;
    const date = dateKey();
    const wasDone = logs.some((l) => l.habitId === id && l.date === date);
    const apply = (done: boolean) => setLogs((p) => {
      const rest = p.filter((l) => !(l.habitId === id && l.date === date));
      return done ? [...rest, { habitId: id, date }] : rest;
    });
    apply(!wasDone); // optimistic
    try { await habitService.setDone(userId, id, date, !wasDone); setError(null); }
    catch (e) { apply(wasDone); setError(errMsg(e)); }
  }, [userId, logs]);

  const items: HabitWithStatus[] = useMemo(() => {
    const today = dateKey();
    return habits.map((h) => {
      const dates = new Set(logs.filter((l) => l.habitId === h.id).map((l) => l.date));
      return { ...h, doneToday: dates.has(today), streak: computeStreak(dates) };
    });
  }, [habits, logs]);

  const doneCount = items.filter((h) => h.doneToday).length;
  return { habits: items, loading, error, doneCount, total: items.length, progress: items.length ? doneCount / items.length : 0,
    addHabit, renameHabit, deleteHabit, toggleHabit, reload: load };
}
