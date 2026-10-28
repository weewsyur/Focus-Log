import { useState } from 'react';
import type { HabitWithStatus } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface HabitListProps {
  habits: HabitWithStatus[];
  onToggle: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
}

export function HabitList({ habits, onToggle, onRename, onDelete }: HabitListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleting, setDeleting] = useState<HabitWithStatus | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  if (habits.length === 0) return <p className="py-2 text-sm text-app-muted">No habits yet. Add one on the Habits page.</p>;

  const save = (id: string) => {
    const name = draft.trim();
    if (name && onRename) onRename(id, name);
    setEditingId(null);
  };
  return (
    <>
      <ul>
        {habits.map((h) => (
          <li key={h.id} className="flex items-center gap-3 border-b border-app-border py-2.5 text-sm last:border-0">
            <input type="checkbox" className="h-4 w-4 accent-app-success" checked={h.doneToday} onChange={() => onToggle(h.id)} aria-label={`Mark ${h.name} done`} />
            <span className={`min-w-0 flex-1 truncate ${h.doneToday ? 'text-app-muted line-through' : ''}`}>{h.name}</span>
            <span className="text-[11px] text-app-muted">{h.streak}d streak</span>
            {onRename && <button type="button" className="text-xs text-app-primary hover:underline" onClick={() => { setDraft(h.name); setEditingId(h.id); }}>Edit</button>}
            {onDelete && <button type="button" className="text-xs text-app-danger hover:underline" onClick={() => setDeleting(h)}>Delete</button>}
          </li>
        ))}
      </ul>
      {editingId && onRename && (
        <Modal title="Edit habit" onClose={() => setEditingId(null)}>
          <form onSubmit={(event) => { event.preventDefault(); save(editingId); }} className="flex flex-col gap-4">
            <label htmlFor="edit-habit-name" className="text-xs font-bold uppercase tracking-wider text-app-muted">Habit name</label>
            <input
              id="edit-habit-name"
              autoFocus
              value={draft}
              maxLength={60}
              onChange={(event) => setDraft(event.target.value)}
              className="rounded-lg border border-app-border-strong px-3 py-2 text-sm outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/20"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={!draft.trim()}>Save habit</Button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && onDelete && (
        <Modal title="Delete habit?" onClose={() => { if (!deleteBusy) setDeleting(null); }}>
          <p className="text-sm leading-6 text-app-slate">
            Delete <span className="font-bold text-app-navy">{deleting.name}</span>? Its completion history will also be removed. This can’t be undone.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={deleteBusy}
              onClick={async () => {
                setDeleteBusy(true);
                try { await onDelete(deleting.id); setDeleting(null); }
                finally { setDeleteBusy(false); }
              }}
            >
              {deleteBusy ? 'Deleting…' : 'Delete habit'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
