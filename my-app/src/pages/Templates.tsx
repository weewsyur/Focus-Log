import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Stepper } from '../components/ui/Stepper';
import { useAuth } from '../hooks/useAuthContext';
import { useTimer } from '../hooks/useTimer';
import { navigate } from '../hooks/useRoute';
import { useToast } from '../hooks/useToast';
import { MAX_CUSTOM_TEMPLATES, templateService, type TemplateInput } from '../services/templateService';
import type { FocusTemplate } from '../types';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';

type TemplateTab = 'presets' | 'mine';

export function Templates() {
  const { user } = useAuth();
  const timer = useTimer();
  const { notify } = useToast();
  const [items, setItems] = useState<FocusTemplate[]>([]);
  const [tab, setTab] = useState<TemplateTab>('presets');
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FocusTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<FocusTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);

  const refresh = async (userId: string) => {
    try { setItems(await templateService.list(userId)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load templates.'); }
  };
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await templateService.list(userId);
        if (!cancelled) { setItems(loaded); setError(null); }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setError(e instanceof Error ? e.message : 'Could not load templates.');
        }
      } finally {
        if (!cancelled) setLoadedUserId(userId);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);
  const loading = loadedUserId !== userId;
  const customCount = items.filter((item) => !item.isPreset).length;

  const openNew = (source?: FocusTemplate) => {
    setEditing(null);
    setCreating(true);
    setName(source ? `${source.name} copy` : '');
    setDescription(source?.description ?? '');
    setSubject(source?.config.subject ?? '');
    setFocusMin(source?.config.focusMin ?? timer.focusMin);
    setBreakMin(source?.config.breakMin ?? timer.breakMin);
    setError(null);
  };
  const openEdit = (template: FocusTemplate) => {
    setEditing(template);
    setCreating(false);
    setName(template.name);
    setDescription(template.description);
    setSubject(template.config.subject);
    setFocusMin(template.config.focusMin);
    setBreakMin(template.config.breakMin);
    setError(null);
  };
  const closeForm = () => { if (!busy) { setCreating(false); setEditing(null); } };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || busy) return;
    const input: TemplateInput = { name, description, config: { subject, focusMin, breakMin } };
    setBusy(true);
    try {
      if (editing) await templateService.update(user.id, editing.id, input);
      else await templateService.create(user.id, input);
      await refresh(user.id);
      notify('success', editing ? 'Template updated.' : 'Template created.');
      setCreating(false);
      setEditing(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save this template.';
      setError(message);
      notify('error', message);
    } finally { setBusy(false); }
  };
  const duplicate = async (template: FocusTemplate) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await templateService.duplicate(user.id, template.id);
      await refresh(user.id);
      setTab('mine');
      notify('success', 'Template duplicated.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not duplicate this template.';
      setError(message);
      notify('error', message);
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!user || !deleting || busy) return;
    setBusy(true);
    try {
      await templateService.remove(user.id, deleting.id);
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      notify('success', 'Template deleted.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not delete this template.';
      setError(message);
      notify('error', message);
    } finally { setBusy(false); }
  };
  const applyTemplate = (template: FocusTemplate) => {
    if (timer.status !== 'idle') return;
    timer.setSubject(template.config.subject);
    timer.setDurations(template.config.focusMin, template.config.breakMin);
    navigate('focus');
  };
  const visible = items.filter((item) => tab === 'presets' ? item.isPreset : !item.isPreset);

  return (
    <AppLayout active="templates" title="Templates" actions={<Button size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={customCount >= MAX_CUSTOM_TEMPLATES} onClick={() => openNew()}>New template</Button>}>
      <Card>
        <div className="mb-4 flex gap-2" role="tablist" aria-label="Template type">
          <button type="button" role="tab" aria-selected={tab === 'presets'} onClick={() => setTab('presets')} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'presets' ? 'bg-app-primary text-app-white' : 'bg-app-surface text-app-navy'}`}>Presets</button>
          <button type="button" role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === 'mine' ? 'bg-app-primary text-app-white' : 'bg-app-surface text-app-navy'}`}>My Templates</button>
        </div>
        {customCount >= MAX_CUSTOM_TEMPLATES && tab === 'mine' && <p className="mb-3 text-sm text-app-muted">You can save up to {MAX_CUSTOM_TEMPLATES} custom templates.</p>}
        {loading ? <p className="text-sm text-app-muted">Loading templates…</p> : error && items.length === 0 ? <p role="alert" className="text-sm text-app-danger">{error}</p> : visible.length === 0 ? (
          <div className="rounded-lg bg-app-surface p-6 text-center">
            <p className="text-sm text-app-muted">{tab === 'mine' ? 'No custom templates yet. Create your first one.' : 'No preset templates are available.'}</p>
            {tab === 'mine' && <Button className="mt-3" size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={customCount >= MAX_CUSTOM_TEMPLATES} onClick={() => openNew()}>Create template</Button>}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {visible.map((template) => (
              <li key={template.id} className="rounded-lg border border-app-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{template.name}</h2>
                      <span className="rounded-full bg-app-blue-pale px-2 py-0.5 text-[10px] font-bold text-app-navy">{template.isPreset ? 'Preset' : 'Custom'}</span>
                    </div>
                    <p className="mt-1 text-sm text-app-muted">{template.description || 'No description'}</p>
                    <p className="mt-3 text-xs text-app-muted">{template.config.subject} · {template.config.focusMin} min focus / {template.config.breakMin === 0 ? 'no break' : `${template.config.breakMin} min break`}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" disabled={timer.status !== 'idle'} onClick={() => applyTemplate(template)}>Use</Button>
                  {template.isPreset ? (
                    <Button size="sm" variant="ghost" icon={<Copy size={14} aria-hidden="true" />} disabled={busy || customCount >= MAX_CUSTOM_TEMPLATES} onClick={() => void duplicate(template)}>Duplicate</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" icon={<Pencil size={14} aria-hidden="true" />} disabled={busy} onClick={() => openEdit(template)}>Edit</Button>
                      <Button size="sm" variant="ghost" icon={<Copy size={14} aria-hidden="true" />} disabled={busy || customCount >= MAX_CUSTOM_TEMPLATES} onClick={() => void duplicate(template)}>Duplicate</Button>
                      <Button size="sm" variant="danger" icon={<Trash2 size={14} aria-hidden="true" />} disabled={busy} onClick={() => setDeleting(template)}>Delete</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {timer.status !== 'idle' && <p className="mt-3 text-xs text-app-muted">Pause or reset the active timer before using a template.</p>}
        {error && items.length > 0 && <p role="alert" className="mt-3 text-sm text-app-danger">{error}</p>}
      </Card>

      {(creating || editing) && (
        <Modal title={editing ? 'Edit template' : 'Create template'} onClose={closeForm}>
          <form onSubmit={(event) => void save(event)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">Template name
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} rows={2} className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">Session title
              <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={60} required className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            <div className="flex items-center justify-between gap-3 text-sm font-bold">Focus length <Stepper label="focus length" value={focusMin} min={1} max={180} onChange={setFocusMin} disabled={busy} /></div>
            <div className="flex items-center justify-between gap-3 text-sm font-bold">Break length <Stepper label="break length" value={breakMin} min={0} max={60} onChange={setBreakMin} disabled={busy} /></div>
            <p className="text-xs text-app-muted">Template fields match the existing session form: title, focus length, and break length.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={busy} onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create template'}</Button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete template?" onClose={() => { if (!busy) setDeleting(null); }}>
          <p className="text-sm text-app-slate">Delete <strong className="text-app-navy">{deleting.name}</strong>? Existing sessions will not be changed.</p>
          {error && <p role="alert" className="mt-3 text-sm text-app-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" disabled={busy} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Delete template'}</Button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
