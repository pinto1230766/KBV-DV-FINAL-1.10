import { useState, useMemo, useCallback, useEffect } from 'react';
import { DataOptimizations } from '../utils/performance-optimizations';
import { cache } from '../utils/cache';

export function useOptimizedSearch<T extends { nom: string; congregation?: string }>(
  items: T[],
  initialQuery: string = '',
  debounceMs: number = 300
) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Résultats de recherche optimisés avec cache
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return items;
    
    const cacheKey = `search_${items.length}_${debouncedQuery}`;
    
    return cache.getOrSetSync(
      cacheKey,
      () => DataOptimizations.searchItems(items, debouncedQuery),
      30000 // 30 secondes de cache
    );
  }, [items, debouncedQuery]);

  // Statistiques de recherche
  const searchStats = useMemo(() => ({
    totalItems: items.length,
    filteredItems: searchResults.length,
    hasQuery: debouncedQuery.trim().length > 0,
    isFiltered: searchResults.length < items.length
  }), [items.length, searchResults.length, debouncedQuery]);

  // Fonction de mise à jour optimisée
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  // Fonction de reset
  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    searchResults,
    searchStats,
    updateQuery,
    clearQuery,
    isSearching: query !== debouncedQuery
  };
}

// Hook spécialisé pour la recherche avec filtres avancés
export function useAdvancedSearch<T extends Record<string, any>>(
  items: T[],
  searchFields: (keyof T)[],
  initialFilters: Record<string, any> = {}
) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Recherche avancée avec cache
  const results = useMemo(() => {
    const cacheKey = `advanced_search_${items.length}_${debouncedQuery}_${JSON.stringify(filters)}`;
    
    return cache.getOrSetSync(cacheKey, () => {
      let filtered = items;

      // Appliquer la recherche textuelle
      if (debouncedQuery.trim()) {
        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        filtered = filtered.filter(item =>
          searchFields.some(field => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(normalizedQuery);
          })
        );
      }

      // Appliquer les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filtered = filtered.filter(item => {
            const itemValue = item[key];
            if (Array.isArray(value)) {
              return value.includes(itemValue);
            }
            return itemValue === value;
          });
        }
      });

      return filtered;
    }, 30000);
  }, [items, debouncedQuery, filters, searchFields]);

  const updateQuery = useCallback((newQuery: string) => setQuery(newQuery), []);
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  const clearFilters = useCallback(() => {
    setQuery('');
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    query,
    filters,
    results,
    updateQuery,
    updateFilter,
    clearFilters,
    isSearching: query !== debouncedQuery,
    hasActiveFilters: Object.values(filters).some(v => v !== null && v !== undefined && v !== '')
  };
}