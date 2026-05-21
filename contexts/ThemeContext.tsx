import React, { createContext, useContext } from 'react';
import { COLORS, ThemeColors } from '@/constants/theme';

const ThemeContext = createContext<ThemeColors>(COLORS);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={COLORS}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
