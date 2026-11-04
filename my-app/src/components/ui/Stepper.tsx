import { Minus, Plus } from 'lucide-react';

interface StepperProps { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean; label: string }

export function Stepper({ value, min, max, onChange, disabled, label }: StepperProps) {
  const btn = 'grid h-7 w-7 place-items-center rounded-md border border-app-border bg-app-white transition-colors hover:bg-app-blue-pale disabled:opacity-40';
  return (
    <div className="flex items-center gap-2 text-sm">
      <button type="button" aria-label={`Decrease ${label}`} className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}><Minus size={14} strokeWidth={2} aria-hidden="true" /></button>
      <span className="min-w-14 text-center">{value} min</span>
      <button type="button" aria-label={`Increase ${label}`} className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}><Plus size={14} strokeWidth={2} aria-hidden="true" /></button>
    </div>
  );
}
