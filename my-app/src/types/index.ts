export type Page = 'dashboard' | 'focus' | 'habits' | 'analytics' | 'settings' | 'complete';
export type TimerMode = 'focus' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface RegistrationNames {
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
}
export interface AuthUser extends Required<RegistrationNames> {
  id: string;
  email: string;
  displayName: string;
}
export interface Profile extends Omit<AuthUser, 'id' | 'email'> {
  id: string;
  email: string;
  defaultFocusMin: number;
  defaultBreakMin: number;
}
export interface ProfilePatch {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  displayName?: string;
  defaultFocusMin?: number;
  defaultBreakMin?: number;
}

export interface Habit { id: string; name: string; createdAt: string }
export interface HabitLog { habitId: string; date: string }
export interface HabitWithStatus extends Habit { doneToday: boolean; streak: number }

export interface FocusSession { id: string; subject: string; durationMin: number; completedAt: string }
export interface NewFocusSession { subject: string; durationMin: number }
export interface DailyPoint { date: string; label: string; minutes: number }
