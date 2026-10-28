import { supabase } from '../lib/supabase';
import type { FocusSession, NewFocusSession } from '../types';
import { newId, readLocal, writeLocal } from '../lib/utils';

// Expected table: focus_sessions (id, user_id, subject text, duration_min int, completed_at timestamptz default now())
interface SessionRow { id: string; subject: string; duration_min: number; completed_at: string }
const KEY = 'focuslog.sessions';
const toSession = (r: SessionRow): FocusSession => ({ id: r.id, subject: r.subject, durationMin: r.duration_min, completedAt: r.completed_at });

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
  async create(userId: string, s: NewFocusSession): Promise<FocusSession> {
    if (supabase) {
      const { data, error } = await supabase.from('focus_sessions')
        .insert({ user_id: userId, subject: s.subject, duration_min: s.durationMin })
        .select('id,subject,duration_min,completed_at').single();
      if (error) throw new Error(error.message);
      return toSession(data as SessionRow);
    }
    const session: FocusSession = { id: newId(), subject: s.subject, durationMin: s.durationMin, completedAt: new Date().toISOString() };
    writeLocal(KEY, [session, ...readLocal<FocusSession[]>(KEY, [])]);
    return session;
  },
};
