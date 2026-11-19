import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface StepperProps { value: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean; label: string }

export function Stepper({ value, min, max, onChange, disabled, label }: StepperProps) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(String(value)); }, [value]);
  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) { setText(''); return; }
    const next = Math.min(max, Math.max(min, Number(digits)));
    setText(String(next));
    onChange(next);
  };
  const blur = () => {
    focused.current = false;
    setText(String(value));
  };
  const adjust = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    setText(String(next));
    onChange(next);
  };
  const btn = 'grid h-7 w-7 place-items-center rounded-md border border-app-border bg-app-white transition-colors hover:bg-app-blue-pale disabled:opacity-40';
  return (
    <div className="flex items-center gap-2 text-sm">
      <button type="button" aria-label={`Decrease ${label}`} className={btn} disabled={disabled || value <= min} onClick={() => adjust(-1)}><Minus size={14} strokeWidth={2} aria-hidden="true" /></button>
      <label className="flex items-center gap-1">
        <span className="sr-only">{label}</span>
        <input role="spinbutton" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} inputMode="numeric" pattern="[0-9]*"
          disabled={disabled} value={text} onFocus={() => { focused.current = true; }} onChange={(event) => commit(event.target.value)} onBlur={blur}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') { event.preventDefault(); adjust(1); }
            if (event.key === 'ArrowDown') { event.preventDefault(); adjust(-1); }
          }} className="w-12 rounded-md border border-app-border bg-app-white px-1 py-1 text-center tabular-nums text-app-navy disabled:opacity-60" />
        <span>min</span>
      </label>
      <button type="button" aria-label={`Increase ${label}`} className={btn} disabled={disabled || value >= max} onClick={() => adjust(1)}><Plus size={14} strokeWidth={2} aria-hidden="true" /></button>
    </div>
  );
}
