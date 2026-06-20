import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { lightColors, darkColors } from '../styles/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync('theme');
      if (saved) {
        setIsDark(saved === 'dark');
      } else {
        setIsDark(deviceTheme === 'dark');
      }
    } catch (e) {
      setIsDark(deviceTheme === 'dark');
    } finally {
      setLoaded(true);
    }
  };

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    try {
      await SecureStore.setItemAsync('theme', newVal ? 'dark' : 'light');
    } catch (e) {}
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
