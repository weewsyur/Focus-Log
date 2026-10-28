export function StatsCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="min-w-[110px] flex-1">
      <p className="text-[11px] uppercase tracking-wider text-app-muted">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {hint && <p className="text-xs text-app-muted">{hint}</p>}
    </div>
  );
}
