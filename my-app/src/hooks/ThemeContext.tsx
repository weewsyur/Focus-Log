import { useCallback, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './themeState';

const STORAGE_KEY = 'focus-log-theme';

function isTheme(value: string | undefined): value is Theme {
  return value === 'classic' || value === 'interstellar';
}

function readTheme(): Theme {
  // The head initializer normally applies the saved value before React mounts.
  const appliedTheme = document.documentElement.dataset.theme;
  if (isTheme(appliedTheme)) return appliedTheme;

  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY) ?? undefined;
    return isTheme(savedTheme) ? savedTheme : 'classic';
  } catch (error) {
    console.warn('Could not read the saved theme preference.', error);
    return 'classic';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  const setTheme = useCallback((nextTheme: Theme) => {
    document.documentElement.dataset.theme = nextTheme;
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('Could not save the theme preference; it will remain active until reload.', error);
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
