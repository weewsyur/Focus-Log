import { useState, type FormEvent } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Stepper } from '../components/ui/Stepper';
import { HabitList } from '../components/habits/HabitList';
import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/TimerContext';
import { useHabits } from '../hooks/useHabits';
import { errMsg, initials } from '../lib/utils';

export function Settings() {
  const { profile, updateProfile } = useAuth();
  const timer = useTimer();
  const habits = useHabits();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [focus, setFocus] = useState(profile?.defaultFocusMin ?? 25);
  const [brk, setBrk] = useState(profile?.defaultBreakMin ?? 5);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setMsg({ ok: false, text: 'Name is required.' }); return; }
    setBusy(true);
    try {
      await updateProfile({ displayName: name.trim(), defaultFocusMin: focus, defaultBreakMin: brk });
      timer.setDurations(focus, brk);
      setMsg({ ok: true, text: 'Saved.' });
      setEditing(false);
    } catch (err) { setMsg({ ok: false, text: errMsg(err) }); }
    finally { setBusy(false); }
  };
  return (
    <AppLayout active="settings" title="Profile & settings">
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#2180DB] text-lg font-bold text-white">{initials(profile?.displayName ?? '')}</span>
          <div><p className="text-xl font-bold">{profile?.displayName}</p><p className="text-xs text-[#6B7C93]">{profile?.email}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => { setMsg(null); setEditing(true); }}>Edit profile & timer</Button>
          {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-[#1f9c40]' : 'text-red-600'}`}>{msg.text}</p>}
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Timer defaults">
          <p className="text-sm text-[#6B7C93]">Focus: {profile?.defaultFocusMin ?? 25} min · Break: {profile?.defaultBreakMin ?? 5} min</p>
        </Card>
        <Card title="Your habits">
          {habits.loading ? <p className="text-sm text-[#6B7C93]">Loading…</p> : (
            <HabitList habits={habits.habits} onToggle={(id) => void habits.toggleHabit(id)}
              onRename={(id, n) => void habits.renameHabit(id, n)} onDelete={(id) => void habits.deleteHabit(id)} />
          )}
          {habits.error && <p role="alert" className="mt-2 text-sm text-red-600">{habits.error}</p>}
        </Card>
      </div>
      {editing && (
        <Modal title="Profile & timer settings" onClose={() => { if (!busy) setEditing(false); }}>
          <form onSubmit={(e) => void save(e)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-[#6B7C93]">Display name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="rounded-lg border border-[#E3EAF3] px-3 py-2 text-sm normal-case tracking-normal text-[#0B2F63]" /></label>
            <p className="text-sm text-[#6B7C93]">New sessions start with these lengths.</p>
            <div className="flex items-center justify-between text-sm font-bold">Default focus <Stepper label="default focus" value={focus} min={1} max={180} onChange={setFocus} /></div>
            <div className="flex items-center justify-between text-sm font-bold">Default break <Stepper label="default break" value={brk} min={1} max={60} onChange={setBrk} /></div>
            {msg && !msg.ok && <p role="alert" className="text-sm text-red-600">{msg.text}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}
