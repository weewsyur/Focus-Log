import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser, RegistrationNames } from '../types';
import { formatDisplayName, newId, readLocal, writeLocal } from '../lib/utils';
import { isPasswordValid } from '../lib/passwordValidation';

const LOCAL_KEY = 'focuslog.user';

export interface SignUpResult { user: AuthUser; sessionEstablished: boolean }

function normalizeLocalUser(user: AuthUser): AuthUser {
  const firstName = user.firstName ?? '';
  const lastName = user.lastName ?? '';
  const middleName = user.middleName ?? '';
  const suffix = user.suffix ?? '';
  return {
    ...user, firstName, lastName, middleName, suffix,
    displayName: formatDisplayName({ firstName, middleName, lastName, suffix }, user.displayName ?? user.email.split('@')[0]),
  };
}

function toAuthUser(u: User): AuthUser {
  const email = u.email ?? '';
  const metadata = u.user_metadata as Record<string, unknown>;
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : '';
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : '';
  const middleName = typeof metadata.middle_name === 'string' ? metadata.middle_name : '';
  const suffix = typeof metadata.suffix === 'string' ? metadata.suffix : '';
  const legacyName = typeof metadata.display_name === 'string' ? metadata.display_name : email.split('@')[0];
  return {
    id: u.id, email, firstName, lastName, middleName, suffix,
    displayName: formatDisplayName({ firstName, middleName, lastName, suffix }, legacyName),
  };
}

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session ? toAuthUser(data.session.user) : null;
    }
    const user = readLocal<AuthUser | null>(LOCAL_KEY, null);
    return user ? normalizeLocalUser(user) : null;
  },
  async signIn(email: string, password: string): Promise<AuthUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)) {
          throw new Error('Email or password is incorrect.');
        }
        throw new Error(`Authentication failed: ${error.message}`);
      }
      return toAuthUser(data.user);
    }
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const stored = readLocal<AuthUser | null>(LOCAL_KEY, null);
    const user = stored?.email === email ? normalizeLocalUser(stored) : {
      id: newId(), email, firstName: '', lastName: '', middleName: '', suffix: '', displayName: email.split('@')[0],
    };
    writeLocal(LOCAL_KEY, user);
    return user;
  },
  async signUp(names: RegistrationNames, email: string, password: string): Promise<SignUpResult> {
    const firstName = names.firstName.trim();
    const lastName = names.lastName.trim();
    if (!firstName || !lastName) throw new Error('First name and last name are required.');
    if (!isPasswordValid(password)) throw new Error('Password does not meet all requirements.');
    const middleName = names.middleName?.trim() ?? '';
    const suffix = names.suffix?.trim() ?? '';
    const displayName = formatDisplayName({ firstName, middleName, lastName, suffix });
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName, middle_name: middleName || null, suffix: suffix || null, display_name: displayName } },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Sign up failed. Please try again.');
      return { user: toAuthUser(data.user), sessionEstablished: Boolean(data.session) };
    }
    const user: AuthUser = { id: newId(), email, firstName, lastName, middleName, suffix, displayName };
    writeLocal(LOCAL_KEY, user);
    return { user, sessionEstablished: true };
  },
  async signOut(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      return;
    }
    try { localStorage.removeItem(LOCAL_KEY); }
    catch (e) { throw new Error('Could not clear the local session.', { cause: e }); }
  },
};
