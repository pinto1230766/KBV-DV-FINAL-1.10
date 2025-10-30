import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { DataProvider } from './contexts/DataContext';
import { ModalProvider } from './contexts/ModalContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Construct the full URL to sw.js to ensure it's on the correct origin
    const swUrl = new URL('/sw.js', window.location.origin).href;
    navigator.serviceWorker.register(swUrl).then(registration => {
      console.log('SW registered successfully');
    }).catch(registrationError => {
      // Sanitiser l'erreur pour prévenir l'injection de log
      const errorMessage = registrationError instanceof Error 
        ? registrationError.message.replace(/[\r\n\t]/g, ' ').substring(0, 200)
        : 'Unknown error';
      console.log('SW registration failed:', errorMessage);
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
        <ConfirmProvider>
          <DataProvider>
            <ModalProvider>
              <App />
            </ModalProvider>
          </DataProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
