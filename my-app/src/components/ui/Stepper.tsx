interface StepperProps { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean; label: string }

export function Stepper({ value, min, max, onChange, disabled, label }: StepperProps) {
  const btn = 'h-7 w-7 rounded-md border border-[#E3EAF3] bg-white font-bold disabled:opacity-40';
  return (
    <div className="flex items-center gap-2 text-sm">
      <button type="button" aria-label={`Decrease ${label}`} className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span className="min-w-14 text-center">{value} min</span>
      <button type="button" aria-label={`Increase ${label}`} className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
