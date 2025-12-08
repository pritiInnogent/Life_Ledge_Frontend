import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    const isDark = savedSettings.darkMode || false;
    setDarkMode(isDark);
    
    // Apply to document
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = (value) => {
    setDarkMode(value);
    
    // Save to localStorage
    const savedSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    const updated = { ...savedSettings, darkMode: value };
    localStorage.setItem("userSettings", JSON.stringify(updated));
    
    // Apply to document
    document.documentElement.classList.toggle("dark", value);
    document.body.classList.toggle("dark", value);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};