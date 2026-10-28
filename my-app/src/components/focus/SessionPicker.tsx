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
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-[#6B7C93]">Session</label>
      <input
        id={id}
        value={value}
        maxLength={60}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What are you working on?"
        className="w-full rounded-lg border border-[#E3EAF3] px-3 py-2 text-sm disabled:opacity-60"
      />
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
                s === value ? 'border-[#2180DB] bg-[#2180DB] text-white' : 'border-[#E3EAF3] bg-white text-[#0B2F63] hover:bg-[#EAF3FC]'
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