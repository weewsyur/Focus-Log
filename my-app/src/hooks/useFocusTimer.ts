import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimerMode, TimerStatus } from '../types';
import { formatClock } from '../lib/utils';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

export interface TimerCompletion { mode: TimerMode; durationMin: number }
interface Options {
  defaultFocusMin: number;
  defaultBreakMin: number;
  onComplete: (c: TimerCompletion) => void;
}

/** Countdown based on an end timestamp, so throttled intervals or background tabs never cause drift. */
export function useFocusTimer({ defaultFocusMin, defaultBreakMin, onComplete }: Options) {
  const [focusMin, setFocusMin] = useState(defaultFocusMin);
  const [breakMin, setBreakMin] = useState(defaultBreakMin);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingMs, setRemainingMs] = useState(defaultFocusMin * 60000);
  const endAtRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const totalMs = (mode === 'focus' ? focusMin : breakMin) * 60000;

  // One interval exists only while running; cleanup prevents duplicates.
  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => {
      const left = Math.max(0, endAtRef.current - Date.now());
      if (left > 0) { setRemainingMs(left); return; }
      window.clearInterval(id);
      setStatus('idle');
      setMode('focus');
      setRemainingMs(focusMin * 60000);
      onCompleteRef.current({ mode, durationMin: totalMs / 60000 });
    }, 250);
    return () => window.clearInterval(id);
  }, [status, mode, totalMs, focusMin]);

  useEffect(() => {
    document.title = status === 'running' ? `${formatClock(remainingMs)} · Focus Log` : 'Focus Log';
  }, [status, remainingMs]);

  const start = useCallback(() => {
    if (status === 'running') return;
    endAtRef.current = Date.now() + remainingMs;
    setStatus('running');
  }, [status, remainingMs]);
  const pause = useCallback(() => {
    if (status !== 'running') return;
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    setStatus('paused');
  }, [status]);
  const reset = useCallback(() => { setStatus('idle'); setRemainingMs(totalMs); }, [totalMs]);
  const startBreak = useCallback(() => {
    setMode('break');
    setRemainingMs(breakMin * 60000);
    endAtRef.current = Date.now() + breakMin * 60000;
    setStatus('running');
  }, [breakMin]);
  const skipBreak = useCallback(() => { setMode('focus'); setStatus('idle'); setRemainingMs(focusMin * 60000); }, [focusMin]);
  const setDurations = useCallback((f: number, b: number) => {
    const nf = clamp(f, 1, 180), nb = clamp(b, 1, 60);
    setFocusMin(nf); setBreakMin(nb);
    if (status === 'idle') setRemainingMs((mode === 'focus' ? nf : nb) * 60000);
  }, [status, mode]);

  return { mode, status, remainingMs, totalMs, focusMin, breakMin, start, pause, reset, startBreak, skipBreak, setDurations };
}
