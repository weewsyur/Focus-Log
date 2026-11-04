import { supabase } from '../lib/supabase';
import type { AuthUser, Profile, ProfilePatch } from '../types';
import { formatDisplayName, readLocal, writeLocal } from '../lib/utils';

// Expected table: profiles (id uuid pk = auth.users.id, name fields, display_name legacy fallback, timer defaults)
interface ProfileRow {
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  suffix: string | null;
  display_name: string | null;
  default_focus_min: number | null;
  default_break_min: number | null;
}
const LOCAL_KEY = 'focuslog.profile';

export const profileService = {
  async get(user: AuthUser): Promise<Profile> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles')
        .select('first_name,last_name,middle_name,suffix,display_name,default_focus_min,default_break_min')
        .eq('id', user.id).maybeSingle();
      if (error) throw new Error(error.message);
      const r = data as ProfileRow | null;
      const names = {
        firstName: r?.first_name ?? user.firstName,
        middleName: r?.middle_name ?? user.middleName,
        lastName: r?.last_name ?? user.lastName,
        suffix: r?.suffix ?? user.suffix,
      };
      return { id: user.id, email: user.email, ...names,
        displayName: formatDisplayName(names, r?.display_name ?? user.displayName),
        defaultFocusMin: r?.default_focus_min ?? 25, defaultBreakMin: r?.default_break_min ?? 5 };
    }
    const l = readLocal<ProfilePatch>(LOCAL_KEY, {});
    const names = {
      firstName: l.firstName ?? user.firstName,
      middleName: l.middleName ?? user.middleName,
      lastName: l.lastName ?? user.lastName,
      suffix: l.suffix ?? user.suffix,
    };
    return { id: user.id, email: user.email, ...names,
      displayName: formatDisplayName(names, l.displayName ?? user.displayName),
      defaultFocusMin: l.defaultFocusMin ?? 25, defaultBreakMin: l.defaultBreakMin ?? 5 };
  },
  async update(user: AuthUser, patch: ProfilePatch): Promise<Profile> {
    const current = await this.get(user);
    const names = {
      firstName: patch.firstName ?? current.firstName,
      middleName: patch.middleName ?? current.middleName,
      lastName: patch.lastName ?? current.lastName,
      suffix: patch.suffix ?? current.suffix,
    };
    const next: Profile = {
      ...current, ...patch, ...names,
      displayName: formatDisplayName(names, patch.displayName ?? current.displayName),
    };
    if (supabase) {
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id, first_name: next.firstName || null, last_name: next.lastName || null,
        middle_name: next.middleName || null, suffix: next.suffix || null, display_name: next.displayName,
        default_focus_min: next.defaultFocusMin, default_break_min: next.defaultBreakMin,
      }).select('id').single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('The updated profile could not be confirmed by Supabase.');
    } else {
      writeLocal(LOCAL_KEY, {
        firstName: next.firstName, lastName: next.lastName, middleName: next.middleName, suffix: next.suffix,
        displayName: next.displayName, defaultFocusMin: next.defaultFocusMin, defaultBreakMin: next.defaultBreakMin,
      });
    }
    return next;
  },
};
