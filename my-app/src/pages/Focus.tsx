import { useEffect, useState, type FormEvent } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Stepper } from '../components/ui/Stepper';
import { FocusTimer } from '../components/focus/FocusTimer';
import { TimerControls } from '../components/focus/TimerControls';
import { useTimer } from '../hooks/useTimer';
import { useAnalytics } from '../hooks/useAnalytics';
import { SessionPicker } from '../components/focus/SessionPicker';
import { DEFAULT_SESSION_NAME, buildSuggestions } from '../lib/utils';
import { useHabits } from '../hooks/useHabits';
import { useAuth } from '../hooks/useAuthContext';
import { useToast } from '../hooks/useToast';
import { templateService, type TemplateInput } from '../services/templateService';
import type { FocusTemplate } from '../types';
import { BookmarkPlus } from 'lucide-react';

export function Focus() {
  const t = useTimer();
  const { user } = useAuth();
  const { notify } = useToast();
  const stats = useAnalytics(7);
  const habits = useHabits();
  const suggestions = buildSuggestions(habits.habits.map((h) => h.name), stats.recent.map((r) => r.subject));
  const idle = t.status === 'idle';
  const slots = Math.max(4, stats.todayCount);
  const label = t.mode === 'focus' ? `${t.subject.trim() || DEFAULT_SESSION_NAME} · session ${stats.todayCount + 1} today` : 'Break time';
  const [templates, setTemplates] = useState<FocusTemplate[]>([]);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [loadedTemplateUserId, setLoadedTemplateUserId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const templateLoading = loadedTemplateUserId !== user?.id;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void templateService.list(user.id).then((items) => {
      if (!cancelled) { setTemplates(items); setTemplateError(null); }
    }).catch((error: unknown) => {
      if (!cancelled) setTemplateError(error instanceof Error ? error.message : 'Could not load templates.');
    }).finally(() => {
      if (!cancelled) setLoadedTemplateUserId(user.id);
    });
    return () => { cancelled = true; };
  }, [user]);

  const applyTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template || !idle) return;
    t.setSubject(template.config.subject);
    t.setDurations(template.config.focusMin, template.config.breakMin);
  };

  const saveAsTemplate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || savingTemplate) return;
    const input: TemplateInput = {
      name: templateName,
      description: templateDescription,
      config: { subject: t.subject.trim() || DEFAULT_SESSION_NAME, focusMin: t.focusMin, breakMin: t.breakMin },
    };
    setSavingTemplate(true);
    try {
      await templateService.create(user.id, input);
      setTemplates(await templateService.list(user.id));
      setSaveOpen(false);
      notify('success', 'Template saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this template.';
      setTemplateError(message);
      notify('error', message);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <AppLayout active="focus" title="Focus">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="py-10 lg:col-span-2">
          <FocusTimer remainingMs={t.remainingMs} totalMs={t.totalMs} label={label} running={t.status === 'running'} />
          <TimerControls status={t.status} mode={t.mode} canReset={!idle || t.remainingMs !== t.totalMs}
            onStart={t.start} onPause={t.pause} onReset={t.reset} onSkipBreak={t.skipBreak} />
          <div className="mt-10 flex justify-around text-xs uppercase tracking-wider text-app-muted">
            <span>Mean {stats.meanSessionMin} min</span><span>Today {stats.todayMin} min</span><span>Best {stats.bestSessionMin} min</span>
          </div>
        </Card>
        <Card>
          <div className="mb-5"><SessionPicker value={t.subject} onChange={t.setSubject} suggestions={suggestions} disabled={!idle} /></div>
          <div className="mb-3 flex items-center justify-between text-sm font-bold">Focus
            <Stepper label="focus length" value={t.focusMin} min={1} max={180} disabled={!idle} onChange={(v) => t.setDurations(v, t.breakMin)} /></div>
          <div className="mb-5 flex items-center justify-between text-sm font-bold">Break
            <Stepper label="break length" value={t.breakMin} min={0} max={60} disabled={!idle} onChange={(v) => t.setDurations(t.focusMin, v)} /></div>
          <div className="mb-5 flex flex-wrap gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-bold text-app-muted">
              Use template
              <select value="" disabled={!idle || templateLoading} onChange={(event) => applyTemplate(event.target.value)}
                className="w-full rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm font-normal text-app-navy disabled:opacity-60">
                <option value="">{templateLoading ? 'Loading templates…' : 'Choose a template'}</option>
                <optgroup label="Presets">
                  {templates.filter((item) => item.isPreset).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
                <optgroup label="My Templates">
                  {templates.filter((item) => !item.isPreset).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
              </select>
            </label>
            <Button className="self-end" size="sm" variant="ghost" icon={<BookmarkPlus size={14} aria-hidden="true" />}
              disabled={!idle} onClick={() => {
                setTemplateName('');
                setTemplateDescription('');
                setSaveOpen(true);
              }}>Save as template</Button>
          </div>
          {templateError && <p role="alert" className="mb-3 text-xs text-app-danger">{templateError}</p>}
          <hr className="border-app-border" />
          <p className="mt-4 text-xs uppercase tracking-wider text-app-muted">Sessions today</p>
          <p className="text-4xl font-bold">{stats.todayCount}</p>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {Array.from({ length: slots }, (_, i) => <span key={i} className={`h-4 w-4 rounded-full ${i < stats.todayCount ? 'bg-app-success' : 'bg-app-blue-soft'}`} />)}
          </div>
          <p className="mt-4 text-xs text-app-muted">Closing this tab mid-session discards it. Only finished sessions are saved.</p>
        </Card>
      </div>
      {saveOpen && (
        <Modal title="Save as template" onClose={() => { if (!savingTemplate) setSaveOpen(false); }}>
          <form onSubmit={(event) => void saveAsTemplate(event)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">Template name
              <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} maxLength={60} required
                className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-app-muted">Description (optional)
              <textarea value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} maxLength={200} rows={2}
                className="rounded-lg border border-app-border bg-app-white px-3 py-2 text-sm text-app-navy" />
            </label>
            {templateError && <p role="alert" className="text-sm text-app-danger">{templateError}</p>}
            <p className="text-xs text-app-muted">{t.subject || DEFAULT_SESSION_NAME} · {t.focusMin} min focus / {t.breakMin === 0 ? 'no break' : `${t.breakMin} min break`}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={savingTemplate} onClick={() => setSaveOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savingTemplate}>{savingTemplate ? 'Saving…' : 'Save template'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}