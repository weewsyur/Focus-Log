import { ListFilter } from 'lucide-react';

interface SessionPickerProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  disabled?: boolean;
  id?: string;
}

/** Free-text session name. Habits and past sessions appear as one-tap suggestions. */
export function SessionPicker({ value, onChange, suggestions, disabled, id = 'session-name' }: SessionPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-app-muted">Session</label>
      <div className="relative">
        <ListFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={16} strokeWidth={2} aria-hidden="true" />
        <input
          id={id}
          value={value}
          maxLength={60}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What are you working on?"
          className="w-full rounded-lg border border-app-border py-2 pl-9 pr-3 text-sm disabled:opacity-60"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggestions from your habits and past sessions">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              aria-pressed={s === value}
              onClick={() => onChange(s)}
              className={`max-w-full truncate rounded-full border px-3 py-1 text-xs disabled:opacity-60 ${
                s === value ? 'border-app-primary bg-app-primary text-app-white' : 'border-app-border bg-app-white text-app-navy hover:bg-app-blue-pale'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}