export const DEFAULT_SESSION_NAME = 'Focus session';

/** Habit names first, then past session names; trimmed and de-duplicated (case-insensitive). */
export function buildSuggestions(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of lists.flat()) {
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (clean && !seen.has(key)) { seen.add(key); out.push(clean); }
  }
  return out;
}

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function formatClock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
export function formatMinutes(min: number): string {
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} m` : `${min} min`;
}
export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}
export function lastNDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}
/** Consecutive active days ending today (or yesterday if today has no activity yet). */
export function computeStreak(active: Set<string>): number {
  const d = new Date();
  if (!active.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (active.has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function computeBestStreak(active: Set<string>): number {
  const days = [...active].sort();
  let best = 0, run = 0, prev: number | null = null;
  for (const k of days) {
    const t = new Date(`${k}T00:00:00`).getTime();
    run = prev !== null && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}
export function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
export function writeLocal(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
export const newId = (): string => crypto.randomUUID();
export const errMsg = (e: unknown, fallback = 'Something went wrong'): string => (e instanceof Error ? e.message : fallback);