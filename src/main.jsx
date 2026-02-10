import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Service Worker登録 (vite-plugin-pwaが自動生成)
// 開発環境ではService Workerを無効化（キャッシュの問題を防ぐ）
// 追加: デバッグ時にSWを無効にしたい場合は VITE_DISABLE_SW を true に設定
if ('serviceWorker' in navigator && !import.meta.env.VITE_DISABLE_SW) {
  // 常にdebug-sw.jsを登録（デバッグ用）
  console.log('Registering /debug-sw.js');
  navigator.serviceWorker.register('/debug-sw.js').catch((error) => {
    console.log('Debug Service Worker registration failed:', error);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

