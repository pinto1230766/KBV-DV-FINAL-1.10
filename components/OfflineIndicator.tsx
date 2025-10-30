import React, { useState, useEffect } from 'react';
import { offlineManager } from '../utils/offline';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier la taille de la queue périodiquement
    const interval = setInterval(() => {
      setQueueSize(offlineManager.getQueueSize());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueSize === 0) return null;

  return (
    <div className={`fixed top-16 left-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
      isOnline 
        ? 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
        : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          isOnline ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${
            isOnline 
              ? 'text-yellow-800 dark:text-yellow-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {isOnline 
              ? `Synchronisation en cours... (${queueSize} action${queueSize > 1 ? 's' : ''})`
              : 'Mode hors ligne'
            }
          </p>
          <p className={`text-xs ${
            isOnline 
              ? 'text-yellow-600 dark:text-yellow-300'
              : 'text-red-600 dark:text-red-300'
          }`}>
            {isOnline 
              ? 'Vos actions seront synchronisées automatiquement'
              : 'Vos actions seront sauvegardées et synchronisées à la reconnexion'
            }
          </p>
        </div>
      </div>
    </div>
  );
}