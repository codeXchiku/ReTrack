import type { ReactNode } from 'react';
import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from './useTheme';

export type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Root theme provider that coordinates status bar styling and provides theme context.
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </>
  );
}

