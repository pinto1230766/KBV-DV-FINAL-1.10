import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useVirtualization } from '../utils/performance-optimizations';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const virtualization = useVirtualization(items, containerHeight, itemHeight, overscan);
  
  const visibleData = useMemo(() => {
    return virtualization.getVisibleItems(scrollTop);
  }, [virtualization, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Optimisation: utiliser requestAnimationFrame pour les gros scrolls
  const throttledScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => handleScroll(e));
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={throttledScroll}
    >
      <div style={{ height: visibleData.totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleData.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleData.items.map((item, index) => (
            <div
              key={visibleData.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleData.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Version simplifiée pour les petites listes
export function SimpleList<T>({
  items,
  renderItem,
  className = '',
  maxHeight = 400
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  maxHeight?: number;
}) {
  // Si la liste est petite, pas besoin de virtualisation
  if (items.length <= 50) {
    return (
      <div className={`overflow-auto ${className}`} style={{ maxHeight }}>
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Pour les grandes listes, utiliser la virtualisation
  return (
    <VirtualizedList
      items={items}
      itemHeight={60} // Hauteur estimée par défaut
      containerHeight={maxHeight}
      renderItem={renderItem}
      className={className}
    />
  );
}