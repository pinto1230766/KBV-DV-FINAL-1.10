import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performance';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

interface PerformanceStats {
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  } | null;
  cacheStats: {
    totalItems: number;
    validItems: number;
    expiredItems: number;
  };
  recentMetrics: Array<{
    name: string;
    value: number;
    timestamp: number;
  }>;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    memoryUsage: null,
    cacheStats: { totalItems: 0, validItems: 0, expiredItems: 0 },
    recentMetrics: []
  });

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      try {
        // Vérifier l'utilisation mémoire
        performanceMonitor.checkMemoryUsage();

        // Récupérer les statistiques
        let memoryUsage = null;
        if (typeof performance !== 'undefined' && 'memory' in performance) {
          const memory = (performance as any).memory;
          const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
          const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
          const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
          memoryUsage = {
            used,
            total,
            limit,
            percentage: Math.round((used / limit) * 100)
          };
        }

        const cacheStats = cache.getStats();
        const recentMetrics = performanceMonitor.getAllMetrics()
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);

        setStats({
          memoryUsage,
          cacheStats,
          recentMetrics
        });
      } catch (error) {
        logger.error('Erreur mise à jour statistiques performance', error as Error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Afficher seulement en développement ou si explicitement activé
  if (process.env.NODE_ENV === 'production' && !localStorage.getItem('debug-performance')) {
    return null;
  }

  return (
    <>
      {/* Bouton toggle */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Moniteur de performance"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Panel de monitoring */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-40 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance
              </h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Utilisation mémoire */}
            {stats.memoryUsage && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mémoire
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Utilisée: {stats.memoryUsage.used} MB</span>
                    <span>{stats.memoryUsage.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        stats.memoryUsage.percentage > 80
                          ? 'bg-red-500'
                          : stats.memoryUsage.percentage > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stats.memoryUsage.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {stats.memoryUsage.total} MB / Limite: {stats.memoryUsage.limit} MB
                  </div>
                </div>
              </div>
            )}

            {/* Statistiques cache */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cache
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {stats.cacheStats.totalItems}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Total</div>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="font-medium text-green-700 dark:text-green-300">
                    {stats.cacheStats.validItems}
                  </div>
                  <div className="text-green-600 dark:text-green-400">Valides</div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="font-medium text-red-700 dark:text-red-300">
                    {stats.cacheStats.expiredItems}
                  </div>
                  <div className="text-red-600 dark:text-red-400">Expirés</div>
                </div>
              </div>
            </div>

            {/* Métriques récentes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Métriques récentes
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {stats.recentMetrics.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    Aucune métrique disponible
                  </div>
                ) : (
                  stats.recentMetrics.map((metric, index) => (
                    <div
                      key={`${metric.name}-${metric.timestamp}-${index}`}
                      className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {metric.name}
                      </span>
                      <span className={`font-mono ${
                        metric.value > 1000
                          ? 'text-red-600 dark:text-red-400'
                          : metric.value > 500
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {Math.round(metric.value)}ms
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  cache.clear();
                  setStats(prev => ({
                    ...prev,
                    cacheStats: { totalItems: 0, validItems: 0, expiredItems: 0 }
                  }));
                }}
                className="flex-1 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
              >
                Vider cache
              </button>
              <button
                onClick={() => {
                  if (typeof performance !== 'undefined') {
                    performance.clearMarks();
                    performance.clearMeasures();
                  }
                }}
                className="flex-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                Reset métriques
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}