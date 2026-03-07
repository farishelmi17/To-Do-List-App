import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'app-theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const setTheme = useCallback((value) => {
    const next = value === 'dark' ? 'dark' : 'light';
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || 'light';
    if (document.documentElement.getAttribute('data-theme') !== stored) {
      document.documentElement.setAttribute('data-theme', stored);
      setThemeState(stored);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
