export type Page = 'dashboard' | 'focus' | 'habits' | 'analytics' | 'settings' | 'complete';
export type TimerMode = 'focus' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface AuthUser { id: string; email: string; displayName: string }
export interface Profile { id: string; email: string; displayName: string; defaultFocusMin: number; defaultBreakMin: number }
export interface ProfilePatch { displayName?: string; defaultFocusMin?: number; defaultBreakMin?: number }

export interface Habit { id: string; name: string; createdAt: string }
export interface HabitLog { habitId: string; date: string }
export interface HabitWithStatus extends Habit { doneToday: boolean; streak: number }

export interface FocusSession { id: string; subject: string; durationMin: number; completedAt: string }
export interface NewFocusSession { subject: string; durationMin: number }
export interface DailyPoint { date: string; label: string; minutes: number }
