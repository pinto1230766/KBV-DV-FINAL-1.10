import { analytics } from './analytics';
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      // Observer pour les métriques de navigation
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.navigationStart);
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observer pour les métriques de ressources
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 1000) { // Ressources lentes > 1s
              logger.warn('Ressource lente détectée', undefined, {
                name: resourceEntry.name,
                duration: resourceEntry.duration
              });
            }
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observer pour les métriques de mesure personnalisées
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric(entry.name, entry.duration);
          }
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (error) {
      logger.error('Erreur initialisation monitoring performance', error as Error);
    }
  }

  startTiming(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endTiming(name: string): number {
    if (typeof performance === 'undefined') return 0;

    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      const duration = measure?.duration || 0;
      
      // Nettoyer les marques
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
      
      return duration;
    } catch (error) {
      logger.error('Erreur mesure performance', error as Error, { name });
      return 0;
    }
  }

  recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now()
    };
    
    this.metrics.set(name, metric);
    
    // Envoyer à analytics si la valeur est significative
    if (value > 100) { // > 100ms
      analytics.track('performance_metric', {
        metric_name: name,
        metric_value: Math.round(value),
        is_slow: value > 1000
      });
    }
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(name);
    return fn().finally(() => {
      this.endTiming(name);
    });
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startTiming(name);
    try {
      return fn();
    } finally {
      this.endTiming(name);
    }
  }

  // Métriques spécifiques à l'application
  measureDataOperation<T>(operation: string, fn: () => T): T {
    return this.measureSync(`data_${operation}`, fn);
  }

  measureAsyncDataOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return this.measureAsync(`data_${operation}`, fn);
  }

  // Surveillance de la mémoire
  checkMemoryUsage(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      this.recordMetric('memory_used_mb', usedMB);
      this.recordMetric('memory_total_mb', totalMB);
      
      // Alerte si utilisation mémoire élevée
      const usagePercent = (usedMB / limitMB) * 100;
      if (usagePercent > 80) {
        logger.warn('Utilisation mémoire élevée', undefined, {
          usedMB,
          totalMB,
          limitMB,
          usagePercent: Math.round(usagePercent)
        });
        
        analytics.track('high_memory_usage', {
          used_mb: usedMB,
          usage_percent: Math.round(usagePercent)
        });
      }
    }
  }

  // Nettoyage
  cleanup(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.error('Erreur déconnexion observer performance', error as Error);
      }
    });
    this.observers = [];
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook pour mesurer les performances des composants React
export function usePerformanceMonitor() {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    checkMemoryUsage: performanceMonitor.checkMemoryUsage.bind(performanceMonitor)
  };
}

// Décorateur pour mesurer automatiquement les fonctions
export function measurePerformance(name?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureSync(measureName, () => {
        return originalMethod?.apply(this, args);
      });
    } as T;

    return descriptor;
  };
}