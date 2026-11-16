import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { AuthUser, Profile, ProfilePatch, RegistrationNames } from '../types';
import { errMsg } from '../lib/utils';
import { useToast } from './useToast';
import { AuthContext } from './useAuthContext';

async function loadProfile(u: AuthUser): Promise<Profile> {
  return profileService.get(u);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const establish = useCallback(async (u: AuthUser, isCurrent: () => boolean = () => true) => {
    let p: Profile;
    try {
      p = await loadProfile(u);
    } catch (e) {
      const message = errMsg(e, 'Could not load your profile.');
      p = {
        id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
        middleName: u.middleName, suffix: u.suffix, displayName: u.displayName,
        defaultFocusMin: 25, defaultBreakMin: 5,
      };
      if (isCurrent()) notify('warning', `Signed in, but profile data could not be loaded: ${message}`);
    }
    if (isCurrent()) {
      setError(null);
      setUser(u);
      setProfile(p);
    }
  }, [notify]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) await establish(u, () => !cancelled);
      } catch (e) {
        if (!cancelled) setError(errMsg(e, 'Could not restore your session.'));
      }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [establish]);
  const signIn = useCallback(async (email: string, password: string) => { await establish(await authService.signIn(email, password)); }, [establish]);
  const signUp = useCallback(async (names: RegistrationNames, email: string, password: string) => {
    const result = await authService.signUp(names, email, password);
    if (result.sessionEstablished) await establish(result.user);
    return result.sessionEstablished;
  }, [establish]);
  const signOut = useCallback(async () => { await authService.signOut(); setUser(null); setProfile(null); window.location.hash = ''; }, []);
  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    if (!user) throw new Error('You must be signed in to update your profile.');
    setProfile(await profileService.update(user, patch));
  }, [user]);

  const value = useMemo(() => ({ user, profile, loading, error, signIn, signUp, signOut, updateProfile }),
    [user, profile, loading, error, signIn, signUp, signOut, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
