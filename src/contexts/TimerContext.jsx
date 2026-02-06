import { createContext, useContext, useEffect, useState } from 'react';

// Timer configuration context
const TimerContext = createContext();

const DEFAULT_SETTINGS = {
  defaultAlarmType: 'beep',
  enableNotifications: true,
  theme: 'dark'
};

const STORAGE_KEY = 'lrtimer_settings';

// Custom hook to use TimerContext
// eslint-disable-next-line react-refresh/only-export-components
export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within TimerProvider');
  }
  return context;
};

// Load settings from localStorage
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return DEFAULT_SETTINGS;
};

// Context Provider component
export function TimerProvider({ children }) {
  const [globalSettings, setGlobalSettings] = useState(loadSettings());

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(globalSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [globalSettings]);

  const updateSettings = (newSettings) => {
    setGlobalSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
    globalSettings,
    updateSettings
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}