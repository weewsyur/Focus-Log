import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './useAuthContext';
import { habitService } from '../services/habitService';
import type { Habit, HabitLog, HabitWithStatus } from '../types';
import { computeStreak, dateKey, errMsg } from '../lib/utils';
import { useToast } from './useToast';

async function fetchHabits(userId: string): Promise<[Habit[], HabitLog[]]> {
  return Promise.all([habitService.list(userId), habitService.logs(userId)]);
}

export function useHabits() {
  const { user } = useAuth();
  const { notify } = useToast();
  const userId = user?.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    const request = ++requestId.current;
    const load = async () => {
      if (!userId) return;
      try {
        const [h, l] = await fetchHabits(userId);
        if (active && request === requestId.current) {
          setHabits(h); setLogs(l); setError(null);
        }
      } catch (e) {
        if (active && request === requestId.current) setError(errMsg(e));
      } finally {
        if (active && request === requestId.current) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [userId]);

  const load = useCallback(async () => {
    if (!userId) return;
    const request = ++requestId.current;
    setLoading(true);
    try {
      const [h, l] = await fetchHabits(userId);
      if (mounted.current && request === requestId.current) {
        setHabits(h); setLogs(l); setError(null);
      }
    } catch (e) {
      if (mounted.current && request === requestId.current) setError(errMsg(e));
    } finally {
      if (mounted.current && request === requestId.current) setLoading(false);
    }
  }, [userId]);

  const addHabit = useCallback(async (name: string) => {
    if (!userId) throw new Error('You must be signed in to add a habit.');
    try {
      const h = await habitService.create(userId, name);
      setHabits((p) => [...p, h]); setError(null);
      notify('success', 'Habit added.');
    } catch (e) {
      const message = errMsg(e);
      setError(message); notify('error', message);
      throw e;
    }
  }, [userId, notify]);

  const renameHabit = useCallback(async (id: string, name: string) => {
    if (!userId) throw new Error('You must be signed in to update a habit.');
    try {
      await habitService.rename(userId, id, name);
      setHabits((p) => p.map((h) => (h.id === id ? { ...h, name } : h))); setError(null);
      notify('success', 'Habit updated.');
    } catch (e) {
      const message = errMsg(e);
      setError(message); notify('error', message);
      throw e;
    }
  }, [userId, notify]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!userId) throw new Error('You must be signed in to delete a habit.');
    try {
      await habitService.remove(userId, id);
      setHabits((p) => p.filter((h) => h.id !== id));
      setLogs((p) => p.filter((l) => l.habitId !== id));
      setError(null);
      notify('success', 'Habit deleted.');
    } catch (e) {
      const message = errMsg(e);
      setError(message); notify('error', message);
      throw e;
    }
  }, [userId, notify]);

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
    catch (e) { apply(wasDone); setError(errMsg(e)); notify('error', errMsg(e)); }
  }, [userId, logs, notify]);

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
