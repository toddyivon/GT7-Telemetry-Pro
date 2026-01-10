'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { theme, lightTheme, darkTheme } from '@/theme/material-theme';

// Create emotion cache for SSR
const createEmotionCache = () => {
  return createCache({ key: 'css' });
};

const clientSideEmotionCache = createEmotionCache();

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  emotionCache?: ReturnType<typeof createEmotionCache>;
}

export default function ThemeProvider({ 
  children, 
  emotionCache = clientSideEmotionCache 
}: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('gt7-theme-mode') as 'light' | 'dark';
    if (savedTheme) {
      setMode(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('gt7-theme-mode', newMode);
  };

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <CacheProvider value={emotionCache}>
      <ThemeContext.Provider value={{ mode, toggleTheme }}>
        <MuiThemeProvider theme={currentTheme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </ThemeContext.Provider>
    </CacheProvider>
  );
}