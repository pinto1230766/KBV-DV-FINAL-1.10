import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    try {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      // Nettoyer les entrées expirées périodiquement
      if (this.cache.size % 10 === 0) {
        this.cleanup();
      }
    } catch (error) {
      logger.error('Erreur mise en cache', error as Error, { key });
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        return null;
      }
      
      const now = Date.now();
      const isExpired = now - item.timestamp > item.ttl;
      
      if (isExpired) {
        this.cache.delete(key);
        return null;
      }
      
      return item.data as T;
    } catch (error) {
      logger.error('Erreur récupération cache', error as Error, { key });
      return null;
    }
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      logger.info('Cache nettoyé', { expiredItems: keysToDelete.length });
    }
  }

  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;
    
    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expiredItems++;
      } else {
        validItems++;
      }
    }
    
    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems
    };
  }

  // Cache avec fonction de récupération
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Erreur récupération données pour cache', error as Error, { key });
      throw error;
    }
  }

  // Cache synchrone avec fonction de récupération
  getOrSetSync<T>(
    key: string,
    fetcher: () => T,
    ttl: number = this.defaultTTL
  ): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    try {
      const data = fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Erreur récupération données synchrone pour cache', error as Error, { key });
      throw error;
    }
  }
}

export const cache = new CacheManager();

// Hook pour utiliser le cache dans les composants React
export function useCache() {
  return {
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    has: cache.has.bind(cache),
    delete: cache.delete.bind(cache),
    getOrSet: cache.getOrSet.bind(cache),
    getOrSetSync: cache.getOrSetSync.bind(cache)
  };
}

// Cache spécialisé pour les calculs coûteux
export class ComputationCache {
  private static instance: ComputationCache;
  private cache = new CacheManager();

  static getInstance(): ComputationCache {
    if (!ComputationCache.instance) {
      ComputationCache.instance = new ComputationCache();
    }
    return ComputationCache.instance;
  }

  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoized_${fn.name}_${key}`;
      
      return this.cache.getOrSetSync(
        cacheKey,
        () => fn(...args),
        ttl
      );
    }) as T;
  }

  memoizeAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cacheKey = `memoized_async_${fn.name}_${key}`;
      
      return this.cache.getOrSet(
        cacheKey,
        () => fn(...args),
        ttl
      );
    }) as T;
  }
}

export const computationCache = ComputationCache.getInstance();

// Décorateur pour la mémoisation automatique
export function memoize(ttl?: number, keyGenerator?: (...args: any[]) => string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = computationCache.memoize(
      originalMethod,
      keyGenerator,
      ttl
    ) as T;

    return descriptor;
  };
}