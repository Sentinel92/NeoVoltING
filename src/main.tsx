import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silently handle benign WebSocket Vite connection logs in sandboxed dev container
if (typeof window !== 'undefined') {
  const origError = console.error;
  const origWarn = console.warn;
  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('WebSocket') || args[0].includes('vite:ws') || args[0].includes('failed to connect'))) {
      return;
    }
    origError(...args);
  };
  console.warn = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && (args[0].includes('WebSocket') || args[0].includes('vite:ws'))) {
      return;
    }
    origWarn(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
