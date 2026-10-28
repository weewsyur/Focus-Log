import { supabase } from '../lib/supabase';
import type { Habit, HabitLog } from '../types';
import { newId, readLocal, writeLocal } from '../lib/utils';

// Expected tables: habits (id, user_id, name, created_at) and habit_logs (habit_id, user_id, log_date date; unique habit_id+log_date)
interface HabitRow { id: string; name: string; created_at: string }
interface LogRow { habit_id: string; log_date: string }
const HABITS_KEY = 'focuslog.habits';
const LOGS_KEY = 'focuslog.habitLogs';
const toHabit = (r: HabitRow): Habit => ({ id: r.id, name: r.name, createdAt: r.created_at });

export const habitService = {
  async list(userId: string): Promise<Habit[]> {
    if (supabase) {
      const { data, error } = await supabase.from('habits').select('id,name,created_at').eq('user_id', userId).order('created_at');
      if (error) throw new Error(error.message);
      return ((data ?? []) as HabitRow[]).map(toHabit);
    }
    return readLocal<Habit[]>(HABITS_KEY, []);
  },
  async create(userId: string, name: string): Promise<Habit> {
    if (supabase) {
      const { data, error } = await supabase.from('habits').insert({ user_id: userId, name }).select('id,name,created_at').single();
      if (error) throw new Error(error.message);
      return toHabit(data as HabitRow);
    }
    const h: Habit = { id: newId(), name, createdAt: new Date().toISOString() };
    writeLocal(HABITS_KEY, [...readLocal<Habit[]>(HABITS_KEY, []), h]);
    return h;
  },
  async rename(userId: string, id: string, name: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('habits').update({ name }).eq('id', id).eq('user_id', userId);
      if (error) throw new Error(error.message);
      return;
    }
    writeLocal(HABITS_KEY, readLocal<Habit[]>(HABITS_KEY, []).map((h) => (h.id === id ? { ...h, name } : h)));
  },
  async remove(userId: string, id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
      if (error) throw new Error(error.message);
      return;
    }
    writeLocal(HABITS_KEY, readLocal<Habit[]>(HABITS_KEY, []).filter((h) => h.id !== id));
    writeLocal(LOGS_KEY, readLocal<HabitLog[]>(LOGS_KEY, []).filter((l) => l.habitId !== id));
  },
  async logs(userId: string): Promise<HabitLog[]> {
    if (supabase) {
      const { data, error } = await supabase.from('habit_logs').select('habit_id,log_date').eq('user_id', userId);
      if (error) throw new Error(error.message);
      return ((data ?? []) as LogRow[]).map((r) => ({ habitId: r.habit_id, date: r.log_date }));
    }
    return readLocal<HabitLog[]>(LOGS_KEY, []);
  },
  async setDone(userId: string, habitId: string, date: string, done: boolean): Promise<void> {
    if (supabase) {
      const q = done
        ? await supabase.from('habit_logs').upsert({ habit_id: habitId, user_id: userId, log_date: date }, { onConflict: 'habit_id,log_date' })
        : await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('user_id', userId).eq('log_date', date);
      if (q.error) throw new Error(q.error.message);
      return;
    }
    const rest = readLocal<HabitLog[]>(LOGS_KEY, []).filter((l) => !(l.habitId === habitId && l.date === date));
    writeLocal(LOGS_KEY, done ? [...rest, { habitId, date }] : rest);
  },
};
