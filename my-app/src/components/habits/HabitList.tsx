import { useState } from 'react';
import { Pencil, Save, Trash2, X } from 'lucide-react';
import type { HabitWithStatus } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Confirmation, ConfirmationActions } from '../ui/Confirmation';

interface HabitListProps {
  habits: HabitWithStatus[];
  onToggle: (id: string) => void;
  onRename?: (id: string, name: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function HabitList({ habits, onToggle, onRename, onDelete }: HabitListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [deleting, setDeleting] = useState<HabitWithStatus | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  if (habits.length === 0) return <p className="py-2 text-sm text-app-muted">No habits yet. Add one on the Habits page.</p>;

  const save = () => {
    const name = draft.trim();
    if (name && onRename) setConfirmingSave(true);
  };
  const confirmSave = async () => {
    if (!editingId || !onRename || saveBusy) return;
    setSaveBusy(true);
    try {
      await onRename(editingId, draft.trim());
      setEditingId(null);
      setConfirmingSave(false);
    } catch {
      return;
    } finally { setSaveBusy(false); }
  };
  return (
    <>
      <ul>
        {habits.map((h) => (
          <li key={h.id} className="flex items-center gap-3 border-b border-app-border py-2.5 text-sm last:border-0">
            <input type="checkbox" className="h-4 w-4 accent-app-success" checked={h.doneToday} onChange={() => onToggle(h.id)} aria-label={`Mark ${h.name} done`} />
            <span className={`min-w-0 flex-1 truncate ${h.doneToday ? 'text-app-muted line-through' : ''}`}>{h.name}</span>
            <span className="text-[11px] text-app-muted">{h.streak}d streak</span>
            {onRename && <button type="button" className="inline-flex items-center gap-1 text-xs text-app-primary hover:underline" onClick={() => { setDraft(h.name); setConfirmingSave(false); setEditingId(h.id); }}><Pencil size={13} strokeWidth={2} aria-hidden="true" />Edit</button>}
            {onDelete && <button type="button" className="inline-flex items-center gap-1 text-xs text-app-danger hover:underline" onClick={() => setDeleting(h)}><Trash2 size={13} strokeWidth={2} aria-hidden="true" />Delete</button>}
          </li>
        ))}
      </ul>
      {editingId && onRename && (
        <Modal title={confirmingSave ? 'Confirm habit changes' : 'Edit habit'} onClose={() => { if (!saveBusy) { setEditingId(null); setConfirmingSave(false); } }}>
          {confirmingSave ? (
            <ConfirmationActions
              message={<>Are you sure you want to save the changes to <strong className="text-app-navy">{draft.trim()}</strong>?</>}
              onConfirm={() => void confirmSave()}
              onCancel={() => setConfirmingSave(false)}
              busy={saveBusy}
              confirmLabel="Yes, save"
            />
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); save(); }} className="flex flex-col gap-4">
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
                <Button variant="ghost" icon={<X size={15} strokeWidth={2} aria-hidden="true" />} onClick={() => setEditingId(null)}>Cancel</Button>
                <Button type="submit" variant="secondary" icon={<Save size={15} strokeWidth={2} aria-hidden="true" />} disabled={!draft.trim()}>Save habit</Button>
              </div>
            </form>
          )}
        </Modal>
      )}
      {deleting && onDelete && (
        <Confirmation
          title="Delete habit?"
          message={<>Delete <span className="font-bold text-app-navy">{deleting.name}</span>? Its completion history will also be removed. This can’t be undone.</>}
          busy={deleteBusy}
          confirmLabel="Yes, delete"
          confirmVariant="danger"
          onCancel={() => { if (!deleteBusy) setDeleting(null); }}
          onConfirm={() => {
            if (deleteBusy) return;
            setDeleteBusy(true);
            void onDelete(deleting.id).then(() => setDeleting(null)).catch(() => undefined).finally(() => setDeleteBusy(false));
          }}
        />
      )}
    </>
  );
}
