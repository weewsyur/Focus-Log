import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { useFocusTimer, type TimerCompletion } from './useFocusTimer';
import { navigate } from './useRoute';
import { focusSessionService } from '../services/focusSessionService';
import type { FocusSession, NewFocusSession } from '../types';
import { DEFAULT_SESSION_NAME, errMsg } from '../lib/utils';
import { useToast } from './ToastContext';

type TimerApi = ReturnType<typeof useFocusTimer>;
interface TimerContextValue extends TimerApi {
  subject: string;
  setSubject: (s: string) => void;
  lastSession: FocusSession | null;
  pendingSession: NewFocusSession | null;
  saveError: string | null;
  savingSession: boolean;
  saveSession: () => Promise<void>;
  discardPendingSession: () => void;
}
const TimerContext = createContext<TimerContextValue | null>(null);

/** Keeps one timer alive across pages and stages completed focus sessions for confirmation. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const { notify } = useToast();
  const [subject, setSubject] = useState('');
  const [lastSession, setLastSession] = useState<FocusSession | null>(null);
  const [pendingSession, setPendingSession] = useState<NewFocusSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const savingRef = useRef(false);
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const handleComplete = useCallback((c: TimerCompletion) => {
    if (c.mode !== 'focus' || !user) return;
    setLastSession(null);
    setPendingSession({ subject: subjectRef.current.trim() || DEFAULT_SESSION_NAME, durationMin: c.durationMin });
    setSaveError(null);
    navigate('complete');
  }, [user]);

  const saveSession = useCallback(async () => {
    if (!pendingSession) throw new Error('There is no completed session waiting to be saved.');
    if (!user) throw new Error('You must be signed in to save this session.');
    if (savingRef.current) return;
    savingRef.current = true;
    setSavingSession(true);
    try {
      const saved = await focusSessionService.create(user.id, pendingSession);
      setLastSession(saved);
      setPendingSession(null);
      setSaveError(null);
      notify('success', 'Focus session saved.');
    } catch (error) {
      const message = errMsg(error, 'Could not save this session.');
      setSaveError(message);
      notify('error', message);
      throw error;
    } finally {
      savingRef.current = false;
      setSavingSession(false);
    }
  }, [pendingSession, user, notify]);
  const discardPendingSession = useCallback(() => {
    if (savingRef.current) return;
    setPendingSession(null);
    setSaveError(null);
    navigate('focus');
  }, []);

  const timer = useFocusTimer({
    defaultFocusMin: profile?.defaultFocusMin ?? 25,
    defaultBreakMin: profile?.defaultBreakMin ?? 5,
    onComplete: handleComplete,
  });
  return <TimerContext.Provider value={{
    ...timer, subject, setSubject, lastSession, pendingSession, saveError, savingSession, saveSession, discardPendingSession,
  }}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider');
  return ctx;
}