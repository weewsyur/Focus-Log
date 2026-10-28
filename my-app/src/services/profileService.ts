import { supabase } from '../lib/supabase';
import type { AuthUser, Profile, ProfilePatch } from '../types';
import { readLocal, writeLocal } from '../lib/utils';

// Expected table: profiles (id uuid pk = auth.users.id, display_name text, default_focus_min int, default_break_min int)
interface ProfileRow { display_name: string | null; default_focus_min: number | null; default_break_min: number | null }
const LOCAL_KEY = 'focuslog.profile';

export const profileService = {
  async get(user: AuthUser): Promise<Profile> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles')
        .select('display_name,default_focus_min,default_break_min').eq('id', user.id).maybeSingle();
      if (error) throw new Error(error.message);
      const r = data as ProfileRow | null;
      return { id: user.id, email: user.email, displayName: r?.display_name ?? user.displayName,
        defaultFocusMin: r?.default_focus_min ?? 25, defaultBreakMin: r?.default_break_min ?? 5 };
    }
    const l = readLocal<ProfilePatch>(LOCAL_KEY, {});
    return { id: user.id, email: user.email, displayName: l.displayName ?? user.displayName,
      defaultFocusMin: l.defaultFocusMin ?? 25, defaultBreakMin: l.defaultBreakMin ?? 5 };
  },
  async update(user: AuthUser, patch: ProfilePatch): Promise<Profile> {
    const next: Profile = { ...(await this.get(user)), ...patch };
    if (supabase) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id, display_name: next.displayName,
        default_focus_min: next.defaultFocusMin, default_break_min: next.defaultBreakMin,
      });
      if (error) throw new Error(error.message);
    } else {
      writeLocal(LOCAL_KEY, { displayName: next.displayName, defaultFocusMin: next.defaultFocusMin, defaultBreakMin: next.defaultBreakMin });
    }
    return next;
  },
};
