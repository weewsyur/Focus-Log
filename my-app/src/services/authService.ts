import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types';
import { newId, readLocal, writeLocal } from '../lib/utils';

const LOCAL_KEY = 'focuslog.user';

function toAuthUser(u: User): AuthUser {
  const email = u.email ?? '';
  const name = (u.user_metadata?.display_name as string | undefined) ?? email.split('@')[0];
  return { id: u.id, email, displayName: name };
}

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      return data.session ? toAuthUser(data.session.user) : null;
    }
    return readLocal<AuthUser | null>(LOCAL_KEY, null);
  },
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return toAuthUser(data.user);
    }
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const stored = readLocal<AuthUser | null>(LOCAL_KEY, null);
    const user = stored?.email === email ? stored : { id: newId(), email, displayName: email.split('@')[0] };
    writeLocal(LOCAL_KEY, user);
    return user;
  },
  async signUp(name: string, email: string, password: string): Promise<AuthUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Sign up failed. Please try again.');
      return toAuthUser(data.user);
    }
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const user: AuthUser = { id: newId(), email, displayName: name };
    writeLocal(LOCAL_KEY, user);
    return user;
  },
  async signOut(): Promise<void> {
    if (supabase) { await supabase.auth.signOut(); return; }
    try { localStorage.removeItem(LOCAL_KEY); }
    catch (e) { throw new Error('Could not clear the local session.', { cause: e }); }
  },
};
