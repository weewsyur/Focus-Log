import { useEffect, useState } from 'react';
import { focusSessionService } from '../services/focusSessionService';
import { useAuth } from './useAuthContext';
import type { FocusSession } from '../types';

export function useSessionHistory(startDate: string, endDate: string, page: number, pageSize: number) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const requestKey = `${user?.id ?? ''}:${startDate}:${endDate}:${page}:${pageSize}`;

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let cancelled = false;
    void focusSessionService.listPage(userId, startDate, endDate, page, pageSize).then((result) => {
      if (cancelled) return;
      setSessions(result.sessions);
      setTotal(result.total);
      setError(null);
    }).catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load session history.');
    }).finally(() => {
      if (!cancelled) setLoadedKey(requestKey);
    });
    return () => { cancelled = true; };
  }, [user?.id, startDate, endDate, page, pageSize, requestKey]);

  return { sessions, total, loading: loadedKey !== requestKey, error };
}
