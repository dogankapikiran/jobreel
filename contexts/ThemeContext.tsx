import React, { createContext, useContext } from 'react';
import { DARK_COLORS, ThemeColors } from '@/constants/theme';

const ThemeContext = createContext<ThemeColors>(DARK_COLORS);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={DARK_COLORS}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
