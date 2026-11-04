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
import { useToast } from '../hooks/ToastContext';
import { initials } from '../lib/utils';
import { Pencil, Repeat, Save, Timer, UserRound } from 'lucide-react';
import { ConfirmationActions } from '../components/ui/Confirmation';

export function Settings() {
  const { profile, updateProfile } = useAuth();
  const { notify } = useToast();
  const timer = useTimer();
  const habits = useHabits();
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [middleName, setMiddleName] = useState(profile?.middleName ?? '');
  const [suffix, setSuffix] = useState(profile?.suffix ?? '');
  const [focus, setFocus] = useState(profile?.defaultFocusMin ?? 25);
  const [brk, setBrk] = useState(profile?.defaultBreakMin ?? 5);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);

  const requestSave = (event: FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      notify('error', 'First name and last name are required.');
      return;
    }
    setConfirmingSave(true);
  };
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await updateProfile({
        firstName: firstName.trim(), lastName: lastName.trim(),
        middleName: middleName.trim(), suffix: suffix.trim(),
        defaultFocusMin: focus, defaultBreakMin: brk,
      });
      timer.setDurations(focus, brk);
      notify('success', 'Profile and timer settings saved.');
      setEditing(false);
      setConfirmingSave(false);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Could not save your profile.');
      setConfirmingSave(false);
    } finally { setBusy(false); }
  };
  return (
    <AppLayout active="settings" title="Profile & settings">
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-app-primary text-lg font-bold text-app-white">{initials(profile?.displayName ?? '')}</span>
          <div><p className="text-xl font-bold">{profile?.displayName}</p><p className="text-xs text-app-muted">{profile?.email}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" icon={<Pencil size={15} strokeWidth={2} aria-hidden="true" />} onClick={() => {
            setFirstName(profile?.firstName ?? ''); setLastName(profile?.lastName ?? '');
            setMiddleName(profile?.middleName ?? ''); setSuffix(profile?.suffix ?? '');
            setFocus(profile?.defaultFocusMin ?? 25); setBrk(profile?.defaultBreakMin ?? 5);
            setConfirmingSave(false); setEditing(true);
          }}>Edit profile & timer</Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Timer defaults" titleIcon={<Timer size={16} strokeWidth={2} aria-hidden="true" />}>
          <p className="text-sm text-app-muted">Focus: {profile?.defaultFocusMin ?? 25} min · Break: {profile?.defaultBreakMin ?? 5} min</p>
        </Card>
        <Card title="Your habits" titleIcon={<Repeat size={16} strokeWidth={2} aria-hidden="true" />}>
          {habits.loading ? <p className="text-sm text-app-muted">Loading…</p> : (
            <HabitList habits={habits.habits} onToggle={(id) => void habits.toggleHabit(id)}
              onRename={habits.renameHabit} onDelete={habits.deleteHabit} />
          )}
          {habits.error && <p role="alert" className="mt-2 text-sm text-app-danger">{habits.error}</p>}
        </Card>
      </div>
      {editing && (
        <Modal title={confirmingSave ? 'Confirm profile changes' : 'Profile & timer settings'} onClose={() => { if (!busy) { setEditing(false); setConfirmingSave(false); } }}>
          {confirmingSave ? (
            <ConfirmationActions
              message="Are you sure you want to save these profile and timer changes?"
              onConfirm={() => void save()}
              onCancel={() => setConfirmingSave(false)}
              busy={busy}
            />
          ) : (
            <form onSubmit={(event) => requestSave(event)} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-app-muted">Last name
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={15} strokeWidth={2} aria-hidden="true" />
                  <input value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={80} required autoComplete="family-name" className="w-full rounded-lg border border-app-border py-2 pl-9 pr-3 text-sm normal-case tracking-normal text-app-navy" />
                </span>
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-app-muted">First name
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={15} strokeWidth={2} aria-hidden="true" />
                  <input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={80} required autoComplete="given-name" className="w-full rounded-lg border border-app-border py-2 pl-9 pr-3 text-sm normal-case tracking-normal text-app-navy" />
                </span>
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-app-muted">Middle name (optional)
                <input value={middleName} onChange={(event) => setMiddleName(event.target.value)} maxLength={80} autoComplete="additional-name" className="w-full rounded-lg border border-app-border px-3 py-2 text-sm normal-case tracking-normal text-app-navy" />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-app-muted">Suffix (optional)
                <input value={suffix} onChange={(event) => setSuffix(event.target.value)} maxLength={20} autoComplete="honorific-suffix" className="w-full rounded-lg border border-app-border px-3 py-2 text-sm normal-case tracking-normal text-app-navy" />
              </label>
              <p className="text-sm text-app-muted">New sessions start with these lengths.</p>
              <div className="flex items-center justify-between text-sm font-bold">Default focus <Stepper label="default focus" value={focus} min={1} max={180} onChange={setFocus} /></div>
              <div className="flex items-center justify-between text-sm font-bold">Default break <Stepper label="default break" value={brk} min={1} max={60} onChange={setBrk} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" variant="secondary" icon={<Save size={15} strokeWidth={2} aria-hidden="true" />} disabled={busy}>Save changes</Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </AppLayout>
  );
}
