import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { useFocusTimer, type TimerCompletion } from './useFocusTimer';
import { navigate } from './useRoute';
import { focusSessionService } from '../services/focusSessionService';
import type { FocusSession } from '../types';
import { SUBJECTS, errMsg } from '../lib/utils';

type TimerApi = ReturnType<typeof useFocusTimer>;
interface TimerContextValue extends TimerApi {
  subject: string;
  setSubject: (s: string) => void;
  lastSession: FocusSession | null;
  saveError: string | null;
}
const TimerContext = createContext<TimerContextValue | null>(null);

/** Keeps one timer alive across pages and saves finished focus sessions. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [lastSession, setLastSession] = useState<FocusSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const subjectRef = useRef(subject);
  useEffect(() => { subjectRef.current = subject; }, [subject]);

  const handleComplete = useCallback((c: TimerCompletion) => {
    if (c.mode !== 'focus' || !user) return;
    focusSessionService.create(user.id, { subject: subjectRef.current, durationMin: c.durationMin })
      .then((s) => { setLastSession(s); setSaveError(null); })
      .catch((e: unknown) => { setLastSession(null); setSaveError(errMsg(e, 'Could not save this session.')); })
      .finally(() => navigate('complete'));
  }, [user]);

  const timer = useFocusTimer({
    defaultFocusMin: profile?.defaultFocusMin ?? 25,
    defaultBreakMin: profile?.defaultBreakMin ?? 5,
    onComplete: handleComplete,
  });
  return <TimerContext.Provider value={{ ...timer, subject, setSubject, lastSession, saveError }}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used inside TimerProvider');
  return ctx;
}
