import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { AuthUser, Profile, ProfilePatch } from '../types';
import { errMsg } from '../lib/utils';

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);

async function loadProfile(u: AuthUser): Promise<Profile> {
  return profileService.get(u);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          const p = await loadProfile(u);
          if (!cancelled) { setUser(u); setProfile(p); }
        }
      } catch (e) {
        if (!cancelled) setError(errMsg(e, 'Could not restore your session.'));
      }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const establish = useCallback(async (u: AuthUser) => {
    const p = await loadProfile(u);
    setUser(u); setProfile(p); setError(null);
  }, []);
  const signIn = useCallback(async (email: string, password: string) => { await establish(await authService.signIn(email, password)); }, [establish]);
  const signUp = useCallback(async (name: string, email: string, password: string) => { await establish(await authService.signUp(name, email, password)); }, [establish]);
  const signOut = useCallback(async () => { await authService.signOut(); setUser(null); setProfile(null); window.location.hash = ''; }, []);
  const updateProfile = useCallback(async (patch: ProfilePatch) => {
    if (user) setProfile(await profileService.update(user, patch));
  }, [user]);

  const value = useMemo(() => ({ user, profile, loading, error, signIn, signUp, signOut, updateProfile }),
    [user, profile, loading, error, signIn, signUp, signOut, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
