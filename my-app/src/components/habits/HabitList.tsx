import { useState } from 'react';
import type { HabitWithStatus } from '../../types';

interface HabitListProps {
  habits: HabitWithStatus[];
  onToggle: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
}

export function HabitList({ habits, onToggle, onRename, onDelete }: HabitListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  if (habits.length === 0) return <p className="py-2 text-sm text-[#6B7C93]">No habits yet. Add one on the Habits page.</p>;

  const save = (id: string) => {
    const name = draft.trim();
    if (name && onRename) onRename(id, name);
    setEditingId(null);
  };
  return (
    <ul>
      {habits.map((h) => (
        <li key={h.id} className="flex items-center gap-3 border-b border-[#E3EAF3] py-2.5 text-sm last:border-0">
          <input type="checkbox" className="h-4 w-4 accent-[#32CC59]" checked={h.doneToday} onChange={() => onToggle(h.id)} aria-label={`Mark ${h.name} done`} />
          {editingId === h.id ? (
            <>
              <input autoFocus value={draft} maxLength={60} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') save(h.id); if (e.key === 'Escape') setEditingId(null); }}
                className="min-w-0 flex-1 rounded-md border border-[#E3EAF3] px-2 py-1" aria-label="Habit name" />
              <button type="button" className="text-xs text-[#2180DB]" onClick={() => save(h.id)}>Save</button>
              <button type="button" className="text-xs text-[#6B7C93]" onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <span className={`min-w-0 flex-1 truncate ${h.doneToday ? 'text-[#6B7C93] line-through' : ''}`}>{h.name}</span>
              <span className="text-[11px] text-[#6B7C93]">{h.streak}d streak</span>
              {onRename && <button type="button" className="text-xs text-[#2180DB]" onClick={() => { setDraft(h.name); setEditingId(h.id); }}>Edit</button>}
              {onDelete && <button type="button" className="text-xs text-red-600" onClick={() => onDelete(h.id)}>Delete</button>}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
