import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Service Worker登録 (vite-plugin-pwaが自動生成)
// 開発環境ではService Workerを無効化（キャッシュの問題を防ぐ）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch((error) => {
    console.log('Service Worker registration failed:', error);
  });
} else if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  // 開発中に古いService Workerを削除
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

