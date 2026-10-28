export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className="h-2 w-full rounded-full bg-app-blue-soft">
      <div className="h-full rounded-full bg-app-success transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
