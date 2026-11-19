import { supabase } from '../lib/supabase';
import { newId, readLocal, writeLocal } from '../lib/utils';
import type { FocusTemplate, TemplateConfig } from '../types';

export type TemplateInput = Pick<FocusTemplate, 'name' | 'description' | 'config'>;
export const MAX_CUSTOM_TEMPLATES = 50;

const PRESETS: FocusTemplate[] = [
  { id: 'preset-pomodoro', userId: null, name: 'Pomodoro Classic', description: 'Classic Pomodoro timing using the 25-minute focus and 5-minute break fields.', isPreset: true, config: { subject: 'Pomodoro Classic', focusMin: 25, breakMin: 5 }, createdAt: '', updatedAt: '' },
  { id: 'preset-deep-work', userId: null, name: 'Deep Work', description: 'A long, uninterrupted block for demanding work.', isPreset: true, config: { subject: 'Deep Work', focusMin: 90, breakMin: 15 }, createdAt: '', updatedAt: '' },
  { id: 'preset-quick-sprint', userId: null, name: 'Quick Sprint', description: 'A short burst for a small task or a quick start.', isPreset: true, config: { subject: 'Quick Sprint', focusMin: 15, breakMin: 3 }, createdAt: '', updatedAt: '' },
  { id: 'preset-study', userId: null, name: 'Study Session', description: 'A steady study block with a short recovery break.', isPreset: true, config: { subject: 'Study', focusMin: 50, breakMin: 10 }, createdAt: '', updatedAt: '' },
  { id: 'preset-reading', userId: null, name: 'Reading Time', description: 'A calm block for focused reading.', isPreset: true, config: { subject: 'Reading', focusMin: 30, breakMin: 5 }, createdAt: '', updatedAt: '' },
  { id: 'preset-writing', userId: null, name: 'Creative Writing', description: 'A dedicated block to draft, revise, or explore ideas.', isPreset: true, config: { subject: 'Creative Writing', focusMin: 45, breakMin: 10 }, createdAt: '', updatedAt: '' },
  { id: 'preset-coding', userId: null, name: 'Coding Block', description: 'A substantial block for coding without distractions.', isPreset: true, config: { subject: 'Coding', focusMin: 60, breakMin: 10 }, createdAt: '', updatedAt: '' },
  { id: 'preset-admin', userId: null, name: 'Admin & Emails', description: 'A short block to clear messages and administrative tasks.', isPreset: true, config: { subject: 'Admin & Emails', focusMin: 20, breakMin: 5 }, createdAt: '', updatedAt: '' },
  { id: 'preset-workout', userId: null, name: 'Workout', description: 'A focused 30-minute workout with no break.', isPreset: true, config: { subject: 'Workout', focusMin: 30, breakMin: 0 }, createdAt: '', updatedAt: '' },
  { id: 'preset-reflection', userId: null, name: 'Reflection & Planning', description: 'A brief pause to reflect and plan your next steps.', isPreset: true, config: { subject: 'Reflection & Planning', focusMin: 10, breakMin: 0 }, createdAt: '', updatedAt: '' },
];

interface TemplateRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  is_preset: boolean;
  config: unknown;
  created_at: string;
  updated_at: string;
}

const localKey = (userId: string) => `focuslog.templates.${userId}`;
const validInteger = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;

export function normalizeTemplateConfig(config: unknown): TemplateConfig {
  const value = typeof config === 'object' && config !== null ? config as Record<string, unknown> : {};
  const subject = typeof value.subject === 'string' ? value.subject.trim() : '';
  return {
    subject: subject.length > 0 && subject.length <= 60 ? subject : 'Focus session',
    focusMin: validInteger(value.focusMin, 1, 180, 25),
    breakMin: validInteger(value.breakMin, 0, 60, 5),
  };
}

const toTemplate = (row: TemplateRow): FocusTemplate => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  description: row.description,
  isPreset: row.is_preset,
  config: normalizeTemplateConfig(row.config),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function cleanInput(input: TemplateInput): TemplateInput {
  const subject = typeof input.config.subject === 'string' ? input.config.subject.trim() : '';
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    config: { subject, focusMin: input.config.focusMin, breakMin: input.config.breakMin },
  };
}

function validate(input: TemplateInput): void {
  if (!input.name || input.name.length > 60) throw new Error('Template name must be between 1 and 60 characters.');
  if (input.description.length > 200) throw new Error('Description must be 200 characters or fewer.');
  if (typeof input.config.subject !== 'string' || !input.config.subject || input.config.subject.length > 60) throw new Error('Session title must be between 1 and 60 characters.');
  if (!Number.isInteger(input.config.focusMin) || input.config.focusMin < 1 || input.config.focusMin > 180) throw new Error('Focus length must be between 1 and 180 minutes.');
  if (!Number.isInteger(input.config.breakMin) || input.config.breakMin < 0 || input.config.breakMin > 60) throw new Error('Break length must be between 0 and 60 minutes.');
}

function serviceError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('You already have a template with that name.');
  if (error.code === 'P0001' && error.message.includes('50 custom templates')) {
    return new Error(`You can save up to ${MAX_CUSTOM_TEMPLATES} custom templates.`);
  }
  if (error.code === '42501') return new Error('You can only manage your own custom templates.');
  return new Error(error.message);
}

function uniqueCopyName(name: string, templates: FocusTemplate[]): string {
  const existing = new Set(templates.filter((item) => !item.isPreset).map((item) => item.name.toLocaleLowerCase()));
  const suffix = ' copy';
  const base = `${name.slice(0, 60 - suffix.length)}${suffix}`;
  if (!existing.has(base.toLocaleLowerCase())) return base;
  for (let number = 2; ; number++) {
    const tail = ` copy ${number}`;
    const candidate = `${name.slice(0, 60 - tail.length)}${tail}`;
    if (!existing.has(candidate.toLocaleLowerCase())) return candidate;
  }
}

export const templateService = {
  async list(userId: string): Promise<FocusTemplate[]> {
    if (supabase) {
      const { data, error } = await supabase.from('templates')
        .select('id,user_id,name,description,is_preset,config,created_at,updated_at')
        .order('name');
      if (error) throw serviceError(error);
      return ((data ?? []) as TemplateRow[]).map(toTemplate);
    }
    const custom = readLocal<FocusTemplate[]>(localKey(userId), []).map((item) => ({
      ...item,
      config: normalizeTemplateConfig(item.config),
    }));
    return [...PRESETS, ...custom];
  },

  async create(userId: string, input: TemplateInput): Promise<FocusTemplate> {
    const value = cleanInput(input);
    validate(value);
    const existing = (await this.list(userId)).filter((item) => !item.isPreset);
    if (existing.length >= MAX_CUSTOM_TEMPLATES) {
      throw new Error(`You can save up to ${MAX_CUSTOM_TEMPLATES} custom templates.`);
    }
    if (existing.some((item) => item.name.toLocaleLowerCase() === value.name.toLocaleLowerCase())) {
      throw new Error('You already have a template with that name.');
    }
    if (supabase) {
      const { data, error } = await supabase.from('templates').insert({
        user_id: userId, name: value.name, description: value.description, is_preset: false, config: value.config,
      }).select('id,user_id,name,description,is_preset,config,created_at,updated_at').single();
      if (error) throw serviceError(error);
      if (!data) throw new Error('The saved template could not be confirmed by Supabase.');
      return toTemplate(data as TemplateRow);
    }
    const now = new Date().toISOString();
    const template: FocusTemplate = { id: newId(), userId, ...value, isPreset: false, createdAt: now, updatedAt: now };
    writeLocal(localKey(userId), [...readLocal<FocusTemplate[]>(localKey(userId), []), template]);
    return template;
  },

  async update(userId: string, id: string, input: TemplateInput): Promise<void> {
    const value = cleanInput(input);
    validate(value);
    const existing = (await this.list(userId)).filter((item) => !item.isPreset);
    if (!existing.some((item) => item.id === id)) throw new Error('Template not found or not editable.');
    if (existing.some((item) => item.id !== id && item.name.toLocaleLowerCase() === value.name.toLocaleLowerCase())) {
      throw new Error('You already have a template with that name.');
    }
    if (supabase) {
      const { data, error } = await supabase.from('templates').update({
        name: value.name, description: value.description, config: value.config, updated_at: new Date().toISOString(),
      }).eq('id', id).eq('user_id', userId).eq('is_preset', false).select('id').maybeSingle();
      if (error) throw serviceError(error);
      if (!data) throw new Error('Template not found or not editable.');
      return;
    }
    const templates = readLocal<FocusTemplate[]>(localKey(userId), []);
    writeLocal(localKey(userId), templates.map((item) => item.id === id ? { ...item, ...value, updatedAt: new Date().toISOString() } : item));
  },

  async remove(userId: string, id: string): Promise<void> {
    if (supabase) {
      const { data, error } = await supabase.from('templates').delete()
        .eq('id', id).eq('user_id', userId).eq('is_preset', false).select('id').maybeSingle();
      if (error) throw serviceError(error);
      if (!data) throw new Error('Template not found or not editable.');
      return;
    }
    const templates = readLocal<FocusTemplate[]>(localKey(userId), []);
    if (!templates.some((item) => item.id === id)) throw new Error('Template not found or not editable.');
    writeLocal(localKey(userId), templates.filter((item) => item.id !== id));
  },

  async duplicate(userId: string, id: string): Promise<FocusTemplate> {
    const templates = await this.list(userId);
    const source = templates.find((item) => item.id === id);
    if (!source) throw new Error('Template not found.');
    const name = uniqueCopyName(source.name, templates);
    return this.create(userId, { name, description: source.description, config: source.config });
  },
};
