import type { DailyPoint } from '../../types';

export function FocusChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.minutes));
  const best = Math.max(0, ...data.map((d) => d.minutes));
  const dense = data.length > 14;
  return (
    <div className="flex h-48 items-end gap-1 sm:gap-2" role="img" aria-label="Daily focus minutes">
      {data.map((d) => (
        <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1 text-[10px]">
          {!dense && d.minutes > 0 && <span>{d.minutes}</span>}
          <div title={`${d.date}: ${d.minutes} min`} style={{ height: `${Math.max(2, (d.minutes / max) * 80)}%` }}
            className={`w-full rounded-t ${best > 0 && d.minutes === best ? 'bg-app-success' : 'bg-app-primary'}`} />
          <span className="min-h-[14px] text-app-muted">{dense && Number(d.label) % 5 !== 0 ? '' : d.label}</span>
        </div>
      ))}
    </div>
  );
}
