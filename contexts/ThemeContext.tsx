import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, ThemeColors } from '@/constants/theme';

const STORAGE_KEY = '@theme_preference';

type ColorScheme = 'light' | 'dark' | 'system';

interface ThemeContextValue extends ThemeColors {
  colorScheme: ColorScheme;
  setColorScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  ...LIGHT_COLORS,
  colorScheme: 'system',
  setColorScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setColorSchemeState(val);
      }
    });
  }, []);

  const setColorScheme = useCallback((s: ColorScheme) => {
    setColorSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s);
  }, []);

  const resolved = colorScheme === 'system' ? (systemScheme ?? 'light') : colorScheme;
  const colors = resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ ...colors, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
