import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const darkTheme = {
  background: '#28282A',
  headerBackground: '#000000',
  cardBackground: '#1A1A1A',
  cardBorder: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#9E9E9E',
  accent: '#85E4FC',
  accentSoft: 'rgba(49, 197, 255, 0.15)',
  danger: '#FF5252',
  dangerSoft: 'rgba(255, 82, 82, 0.15)',
  avatarBackground: '#1A1A1A',
  divider: '#333333',
};

const lightTheme = {
  background: '#F5F6F8',
  headerBackground: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  accent: '#2F8CF4',
  accentSoft: 'rgba(47, 140, 244, 0.15)',
  danger: '#FF5252',
  dangerSoft: 'rgba(255, 82, 82, 0.12)',
  avatarBackground: '#EAEAEA',
  divider: '#E2E8F0',
};

const ThemeContext = createContext({
  theme: darkTheme,
  isLightMode: false,
  colorScheme: 'dark',
  setColorScheme: () => {},
  toggleColorScheme: () => {},
  isLoaded: false,
});

export function ThemeProvider({ children }) {
  const [colorScheme, setColorScheme] = useState('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePreference');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setColorScheme(storedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('themePreference', colorScheme).catch(error => {
      console.error('Error saving theme preference:', error);
    });
  }, [colorScheme, isLoaded]);

  const value = useMemo(() => {
    const isLightMode = colorScheme === 'light';
    return {
      theme: isLightMode ? lightTheme : darkTheme,
      isLightMode,
      colorScheme,
      setColorScheme,
      toggleColorScheme: () => setColorScheme(prev => (prev === 'light' ? 'dark' : 'light')),
      isLoaded,
    };
  }, [colorScheme, isLoaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
