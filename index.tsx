import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register Service Worker for PWA capabilities in production only
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Construct the full URL to sw.js to ensure it's on the correct origin
    const swUrl = new URL('/sw.js', window.location.origin).href;
    navigator.serviceWorker.register(swUrl).then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <SettingsProvider>
          <DataProvider>
            <ConfirmProvider>
              <App />
            </ConfirmProvider>
          </DataProvider>
        </SettingsProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
