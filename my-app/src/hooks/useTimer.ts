import { createContext, useContext } from 'react';
import type { FocusSession, NewFocusSession } from '../types';
import type { useFocusTimer } from './useFocusTimer';

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

export const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used inside TimerProvider');
  return context;
}
