import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { cache, computationCache } from './cache';
import { performanceMonitor } from './performance';
import { Visit, Speaker, Host } from '../types';

// Optimisations pour les calculs de données
export class DataOptimizations {
  // Cache pour les calculs de visites
  static getUpcomingVisits = computationCache.memoize(
    (visits: Visit[]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return visits
        .filter(v => new Date(v.visitDate + 'T00:00:00') >= today)
        .sort((a, b) => new Date(a.visitDate + 'T00:00:00').getTime() - new Date(b.visitDate + 'T00:00:00').getTime());
    },
    (visits) => `upcoming_${visits.length}_${visits.map(v => v.visitId).join(',').slice(0, 50)}`,
    30000 // 30 secondes
  );

  // Cache pour les statistiques
  static getVisitStats = computationCache.memoize(
    (visits: Visit[], archivedVisits: Visit[]) => {
      const totalVisits = visits.length + archivedVisits.length;
      const upcomingCount = visits.length;
      const completedCount = archivedVisits.length;
      
      return {
        totalVisits,
        upcomingCount,
        completedCount,
        completionRate: totalVisits > 0 ? (completedCount / totalVisits) * 100 : 0
      };
    },
    (visits, archived) => `stats_${visits.length}_${archived.length}`,
    60000 // 1 minute
  );

  // Cache pour les tags
  static getAllTags = computationCache.memoize(
    (items: (Speaker | Host)[]) => {
      const tags = new Set<string>();
      items.forEach(item => item.tags?.forEach(tag => tags.add(tag)));
      return Array.from(tags).sort();
    },
    (items) => `tags_${items.length}_${items.map(i => i.nom).join(',').slice(0, 50)}`,
    120000 // 2 minutes
  );

  // Recherche optimisée
  static searchItems = computationCache.memoize(
    <T extends { nom: string; congregation?: string }>(
      items: T[],
      query: string
    ) => {
      const normalizedQuery = query.toLowerCase().trim();
      if (!normalizedQuery) return items;

      return items.filter(item => 
        item.nom.toLowerCase().includes(normalizedQuery) ||
        (item.congregation && item.congregation.toLowerCase().includes(normalizedQuery))
      );
    },
    (items, query) => `search_${items.length}_${query.toLowerCase()}`,
    30000 // 30 secondes
  );
}

// Hook pour optimiser les re-renders
export function useStableCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  const ref = useRef<T>(callback);
  
  useEffect(() => {
    ref.current = callback;
  }, deps);
  
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

// Hook pour la virtualisation des listes
export function useVirtualization(
  items: any[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalCount = items.length;
    
    return {
      visibleCount,
      totalCount,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + overscan, totalCount);
        const actualStartIndex = Math.max(0, startIndex - overscan);
        
        return {
          startIndex: actualStartIndex,
          endIndex,
          items: items.slice(actualStartIndex, endIndex),
          offsetY: actualStartIndex * itemHeight,
          totalHeight: totalCount * itemHeight
        };
      }
    };
  }, [items.length, containerHeight, itemHeight, overscan]);
}

// Hook pour debouncer les recherches
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook pour optimiser les images
export function useImageOptimization() {
  const loadedImages = useRef(new Set<string>());
  
  const preloadImage = useCallback((src: string) => {
    if (loadedImages.current.has(src)) return Promise.resolve();
    
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loadedImages.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.current.has(src);
  }, []);

  return { preloadImage, isImageLoaded };
}

// Optimisations pour les composants lourds
export class ComponentOptimizations {
  // Lazy loading pour les composants
  static createLazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) {
    const LazyComponent = React.lazy(importFn);

    return (props: React.ComponentProps<T>) => {
      const FallbackComponent = fallback;
      return React.createElement(
        React.Suspense,
        { fallback: FallbackComponent ? React.createElement(FallbackComponent) : React.createElement('div', null, 'Chargement...') },
        React.createElement(LazyComponent, props)
      );
    };
  }

  // Mémoisation intelligente
  static memoizeComponent<T extends React.ComponentType<any>>(
    Component: T,
    areEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
  ) {
    return React.memo(Component, areEqual);
  }
}

// Optimisations pour les données
export function optimizeDataOperations() {
  // Désactiver temporairement les mesures de performance JSON car elles causent des erreurs
  // TODO: Réactiver quand les problèmes de sérialisation seront résolus
  console.log('Performance monitoring for JSON operations disabled');
}

// Optimisations pour le stockage
export class StorageOptimizations {
  private static compressionCache = new Map<string, string>();

  // Compression simple pour les gros objets
  static compressData(data: any): string {
    const jsonString = JSON.stringify(data);
    const cacheKey = `compress_${jsonString.length}`;
    
    if (this.compressionCache.has(cacheKey)) {
      return this.compressionCache.get(cacheKey)!;
    }

    // Compression basique (remplacer les répétitions)
    let compressed = jsonString
      .replace(/("id":"[^"]+",)/g, '§1§')
      .replace(/("nom":"[^"]+",)/g, '§2§')
      .replace(/("visitDate":"[^"]+",)/g, '§3§')
      .replace(/("congregation":"[^"]+",)/g, '§4§');

    this.compressionCache.set(cacheKey, compressed);
    return compressed;
  }

  static decompressData(compressed: string): any {
    // Décompression
    const decompressed = compressed
      .replace(/§1§/g, '"id":"",')
      .replace(/§2§/g, '"nom":"",')
      .replace(/§3§/g, '"visitDate":"",')
      .replace(/§4§/g, '"congregation":"",');

    return JSON.parse(decompressed);
  }

  // Stockage par chunks pour éviter les limites
  static async storeInChunks(key: string, data: any, chunkSize: number = 1024 * 1024) {
    const jsonString = JSON.stringify(data);
    const chunks = [];
    
    for (let i = 0; i < jsonString.length; i += chunkSize) {
      chunks.push(jsonString.slice(i, i + chunkSize));
    }

    // Stocker le nombre de chunks
    localStorage.setItem(`${key}_chunks`, chunks.length.toString());
    
    // Stocker chaque chunk
    for (let i = 0; i < chunks.length; i++) {
      localStorage.setItem(`${key}_chunk_${i}`, chunks[i]);
    }
  }

  static async retrieveFromChunks(key: string): Promise<any> {
    const chunkCount = parseInt(localStorage.getItem(`${key}_chunks`) || '0');
    if (chunkCount === 0) return null;

    let jsonString = '';
    for (let i = 0; i < chunkCount; i++) {
      const chunk = localStorage.getItem(`${key}_chunk_${i}`);
      if (chunk) jsonString += chunk;
    }

    return JSON.parse(jsonString);
  }
}

// Initialisation des optimisations
export function initializePerformanceOptimizations() {
  // Activer les optimisations de données
  optimizeDataOperations();
  
  // Nettoyer le cache périodiquement
  setInterval(() => {
    cache.clear();
    performanceMonitor.checkMemoryUsage();
  }, 5 * 60 * 1000); // Toutes les 5 minutes

  // Précharger les ressources critiques
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Précharger les composants lourds pendant les temps morts
      import('../components/CalendarView');
      import('../components/Statistics');
    });
  }
}

// Import React pour les hooks
import React from 'react';