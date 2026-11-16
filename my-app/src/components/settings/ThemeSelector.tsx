import { Palette } from 'lucide-react';
import type { Theme } from '../../hooks/themeState';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'classic', label: 'Classic', description: 'The familiar white and blue look.' },
  { value: 'interstellar', label: 'Interstellar', description: 'Deep space colors and time effects.' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <Card title="Appearance" titleIcon={<Palette size={16} strokeWidth={2} aria-hidden="true" />} className="mb-4">
      <fieldset>
        <legend className="mb-3 text-sm text-app-muted">Choose a theme</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {THEMES.map(({ value, label, description }) => (
            <label key={value} className="theme-option">
              <input
                className="theme-option-input"
                type="radio"
                name="appearance-theme"
                value={value}
                aria-label={`${label} theme`}
                checked={theme === value}
                onChange={() => setTheme(value)}
              />
              <span className="theme-option-card">
                <span className={`theme-preview theme-preview--${value}`} aria-hidden="true">
                  <span className="theme-preview-sidebar" />
                  <span className="theme-preview-content">
                    <span className="theme-preview-heading" />
                    <span className="theme-preview-line" />
                    <span className="theme-preview-accent" />
                  </span>
                </span>
                <span className="theme-option-copy">
                  <span className="font-bold">{label}</span>
                  <span className="text-xs text-app-muted">{description}</span>
                </span>
                <span className="theme-option-check" aria-hidden="true">{theme === value ? 'Selected' : ''}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}
