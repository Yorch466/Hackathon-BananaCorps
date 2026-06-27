import React, { createContext, useContext } from 'react';
import { tokens } from './tokens';
import { typography } from './typography';

const ThemeContext = createContext({
  tokens,
  typography,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ tokens, typography }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
