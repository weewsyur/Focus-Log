import { formatClock } from '../../lib/utils';

interface FocusTimerProps { remainingMs: number; totalMs: number; variant?: 'large' | 'ring'; label?: string }

export function FocusTimer({ remainingMs, totalMs, variant = 'large', label }: FocusTimerProps) {
  const progress = totalMs > 0 ? remainingMs / totalMs : 0;
  if (variant === 'ring') {
    return (
      <div className="relative h-40 w-40 shrink-0" role="timer" aria-label={label}>
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#DCEBFA" strokeWidth="9" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#32CC59" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - progress)} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-3xl font-bold">{formatClock(remainingMs)}</span>
      </div>
    );
  }
  return (
    <div className="text-center" role="timer" aria-label={label}>
      {label && <p className="text-xs uppercase tracking-wider text-[#6B7C93]">{label}</p>}
      <p className="my-6 text-[clamp(64px,13vw,128px)] font-bold leading-none tabular-nums">{formatClock(remainingMs)}</p>
    </div>
  );
}
