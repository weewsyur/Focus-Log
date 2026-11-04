import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmationActions } from '../ui/Confirmation';

export function HabitForm({ onAdd, onAdded, onBusyChange }: {
  onAdd: (name: string) => Promise<void>;
  onAdded: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setConfirming(true);
  };
  const confirmAdd = async () => {
    if (busy) return;
    setBusy(true);
    onBusyChange(true);
    try {
      await onAdd(name.trim());
      setName('');
      setConfirming(false);
      onAdded();
    } catch {
      return;
    } finally { setBusy(false); onBusyChange(false); }
  };
  return (
    confirming ? (
      <ConfirmationActions
        message={<>Are you sure you want to add <strong className="text-app-navy">{name.trim()}</strong> to your habits?</>}
        onConfirm={() => void confirmAdd()}
        onCancel={() => setConfirming(false)}
        busy={busy}
        confirmLabel="Yes, add habit"
      />
    ) : (
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-wider text-app-muted" htmlFor="habit-name">Habit name</label>
        <input id="habit-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Stretch for 5 minutes"
          className="rounded-lg border border-app-border px-3 py-2 text-sm" />
        <Button type="submit" icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />} disabled={busy || !name.trim()}>Add habit</Button>
      </form>
    )
  );
}
