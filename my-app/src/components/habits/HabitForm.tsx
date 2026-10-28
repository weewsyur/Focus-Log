import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';

export function HabitForm({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    await onAdd(value);
    setName('');
    setBusy(false);
  };
  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
      <label className="text-xs uppercase tracking-wider text-app-muted" htmlFor="habit-name">Habit name</label>
      <input id="habit-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Stretch for 5 minutes"
        className="rounded-lg border border-app-border px-3 py-2 text-sm" />
      <Button type="submit" disabled={busy || !name.trim()}>Add habit</Button>
    </form>
  );
}
