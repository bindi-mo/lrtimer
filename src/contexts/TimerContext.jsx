import { createContext, useContext, useState } from 'react';

// タイマー設定用のContextを作成
const TimerContext = createContext();

// Contextの値を使用するためのカスタムフック
export const useTimerContext = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimerContext must be used within TimerProvider');
  }
  return context;
};

// Context Providerコンポーネント
export function TimerProvider({ children }) {
  // グローバルなタイマー設定を管理
  const [globalSettings, setGlobalSettings] = useState({
    defaultAlarmType: 'beep',
    enableNotifications: true,
    theme: 'dark'
  });

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