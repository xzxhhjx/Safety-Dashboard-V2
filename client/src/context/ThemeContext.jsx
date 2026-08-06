import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({ dark: false, toggle: () => {} });

const STORAGE_KEY = 'hse-theme';

function getInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === 'dark';
  } catch { /* localStorage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [dark]);

  const toggle = useCallback(() => setDark(d => !d), []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
