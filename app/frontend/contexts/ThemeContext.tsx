import { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceLight: string;
    surfaceHighlight: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    textDim: string;
    primary: string;
    favorite: string;
    whatsapp: string;
    danger: string;
    success: string;
    info: string;
    border: string;
    placeholder: string;
    trackFalse: string;
    trackTrue: string;
    thumbActive: string;
    thumbInactive: string;
    statusBar: 'light' | 'dark';
    tabBar: string;
    headerBg: string;
    headerTint: string;
    tabBarBorder: string;
  };
}

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceLight: '#f0f0f0',
    surfaceHighlight: '#e8f0fe',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textDim: '#888888',
    primary: '#4A90E2',
    favorite: '#FFD700',
    whatsapp: '#25D366',
    danger: '#ff4444',
    success: '#4CAF50',
    info: '#2196F3',
    border: '#e0e0e0',
    placeholder: '#999999',
    trackFalse: '#d1d1d1',
    trackTrue: '#81C784',
    thumbActive: '#4CAF50',
    thumbInactive: '#f4f3f4',
    statusBar: 'dark',
    tabBar: '#ffffff',
    headerBg: '#ffffff',
    headerTint: '#1a1a1a',
    tabBarBorder: '#e0e0e0',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0c0c0c',
    surface: '#1a1a1a',
    surfaceLight: '#2a2a2a',
    surfaceHighlight: '#1a2a3a',
    text: '#ffffff',
    textSecondary: '#888888',
    textTertiary: '#666666',
    textDim: '#aaaaaa',
    primary: '#4A90E2',
    favorite: '#FFD700',
    whatsapp: '#25D366',
    danger: '#ff4444',
    success: '#4CAF50',
    info: '#2196F3',
    border: '#333333',
    placeholder: '#666666',
    trackFalse: '#767577',
    trackTrue: '#81C784',
    thumbActive: '#4CAF50',
    thumbInactive: '#f4f3f4',
    statusBar: 'light',
    tabBar: '#1a1a1a',
    headerBg: '#1a1a1a',
    headerTint: '#ffffff',
    tabBarBorder: '#333333',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
