import { supabase } from '../lib/supabase';
import type { FocusSession, NewFocusSession } from '../types';
import { newId, readLocal, writeLocal } from '../lib/utils';

// Expected table: focus_sessions (id, user_id, subject text, duration_min int, completed_at timestamptz default now())
interface SessionRow { id: string; subject: string; duration_min: number; completed_at: string }
export interface SessionPage { sessions: FocusSession[]; total: number }
const KEY = 'focuslog.sessions';
const toSession = (r: SessionRow): FocusSession => ({ id: r.id, subject: r.subject, durationMin: r.duration_min, completedAt: r.completed_at });
function localDayStart(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const result = new Date(year, month - 1, date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(result.getTime())
    || result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== date) {
    throw new Error('Invalid session date range.');
  }
  return result;
}

export const focusSessionService = {
  async list(userId: string): Promise<FocusSession[]> {
    if (supabase) {
      const { data, error } = await supabase.from('focus_sessions').select('id,subject,duration_min,completed_at')
        .eq('user_id', userId).order('completed_at', { ascending: false });
      if (error) throw new Error(error.message);
      return ((data ?? []) as SessionRow[]).map(toSession);
    }
    return readLocal<FocusSession[]>(KEY, []);
  },
  async listPage(userId: string, startDate: string, endDate: string, page: number, pageSize: number): Promise<SessionPage> {
    const start = localDayStart(startDate);
    const endExclusive = localDayStart(endDate);
    if (endExclusive < start) throw new Error('End date cannot be before the start date.');
    endExclusive.setDate(endExclusive.getDate() + 1);
    if (supabase) {
      const { data, error, count } = await supabase.from('focus_sessions')
        .select('id,subject,duration_min,completed_at', { count: 'exact' })
        .eq('user_id', userId).gte('completed_at', start.toISOString()).lt('completed_at', endExclusive.toISOString())
        .order('completed_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw new Error(error.message);
      return { sessions: ((data ?? []) as SessionRow[]).map(toSession), total: count ?? 0 };
    }
    const matches = readLocal<FocusSession[]>(KEY, []).filter((session) => {
      const day = new Date(session.completedAt);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      return key >= startDate && key <= endDate;
    });
    return { sessions: matches.slice((page - 1) * pageSize, page * pageSize), total: matches.length };
  },
  async create(userId: string, s: NewFocusSession): Promise<FocusSession> {
    if (supabase) {
      const { data, error } = await supabase.from('focus_sessions')
        .insert({ user_id: userId, subject: s.subject, duration_min: s.durationMin })
        .select('id,subject,duration_min,completed_at').single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('The saved session could not be confirmed by Supabase.');
      return toSession(data as SessionRow);
    }
    const session: FocusSession = { id: newId(), subject: s.subject, durationMin: s.durationMin, completedAt: new Date().toISOString() };
    writeLocal(KEY, [session, ...readLocal<FocusSession[]>(KEY, [])]);
    return session;
  },
};
