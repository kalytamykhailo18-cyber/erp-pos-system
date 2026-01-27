import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import * as serviceWorkerRegistration from './services/serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline support (PART 12: OFFLINE MODE)
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('[App] Service Worker registered - App is ready for offline use');
  },
  onUpdate: () => {
    console.log('[App] New version available! Please refresh to update.');
    // Optionally, show a toast notification to user about update
  },
  onOffline: () => {
    console.log('[App] App is working in offline mode');
  },
  onOnline: () => {
    console.log('[App] Connection restored - syncing data...');
  },
});
