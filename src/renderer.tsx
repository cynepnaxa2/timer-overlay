import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// #region agent log
const log = (msg, data = {}) => {
  fetch('http://127.0.0.1:7245/ingest/f23b35c1-164f-4809-ab92-7ad83d07b816', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'src/renderer.tsx',
      message: msg,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      hypothesisId: 'H_RENDERER_CRASH'
    })
  }).catch(() => {});
};

window.addEventListener('error', (event) => {
  log('Global error caught', { message: event.message, filename: event.filename, lineno: event.lineno });
});

window.addEventListener('unhandledrejection', (event) => {
  log('Unhandled rejection caught', { reason: String(event.reason) });
});

log('Renderer starting execution');
// #endregion

const root = document.getElementById('root');
if (!root) {
  log('Root element not found!');
} else {
log('Root element found, mounting...');
try {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  log('Mount called successfully');
} catch (err) {
  log('Mount failed', { error: String(err) });
}
}
