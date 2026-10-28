import { useEffect, useState } from 'react';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

function splitTime(d: Date): { time: string; period: string } {
  const parts = timeFmt.formatToParts(d);
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  const time = parts.filter((p) => p.type !== 'dayPeriod').map((p) => p.value).join('').trim();
  return { time, period };
}

/** Live clock in the user's local time. The ring fills once per minute (one sweep = 60 seconds). */
export function LoginClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow((prev) => {
        const d = new Date();
        return Math.floor(d.getTime() / 1000) === Math.floor(prev.getTime() / 1000) ? prev : d;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const seconds = now.getSeconds();
  const { time, period } = splitTime(now);
  // No easing on the first second of each minute, so the ring resets instead of sweeping backwards.
  const smooth = seconds !== 0 ? 'transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none' : '';

  return (
    <div className="relative h-48 w-48 shrink-0 md:h-64 md:w-64" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#32CC59" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - seconds / 60)} className={smooth} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tabular-nums md:text-5xl">{time}</span>
          {period && <span className="text-sm font-bold opacity-90">{period}</span>}
        </span>
        <span className="mt-1 text-[11px] opacity-80">{dateFmt.format(now)}</span>
      </div>
    </div>
  );
}