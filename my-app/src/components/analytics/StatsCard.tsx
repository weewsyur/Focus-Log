import type { ReactNode } from 'react';

export function StatsCard({ label, value, hint, icon }: { label: string; value: string | number; hint?: string; icon?: ReactNode }) {
  return (
    <div className="min-w-[110px] flex-1">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-app-muted">{icon}{label}</p>
      <p className="text-3xl font-bold">{value}</p>
      {hint && <p className="text-xs text-app-muted">{hint}</p>}
    </div>
  );
}
