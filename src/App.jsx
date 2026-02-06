import { useEffect } from 'react';
import Timer from './components/Timer';
import { TimerProvider, useTimerContext } from './contexts/TimerContext.jsx';
import './App.css';

function AppContent() {
  const { globalSettings, updateSettings } = useTimerContext();

  // Apply theme class to document root
  useEffect(() => {
    const theme = globalSettings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, [globalSettings.theme]);

  const toggleTheme = () => {
    const newTheme = globalSettings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>LR Timer</h1>
        <button 
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={`Switch to ${globalSettings.theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {globalSettings.theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>
      <main>
        <Timer />
      </main>
    </div>
  );
}

function App() {
  return (
    <TimerProvider>
      <AppContent />
    </TimerProvider>
  );
}

export default App;
