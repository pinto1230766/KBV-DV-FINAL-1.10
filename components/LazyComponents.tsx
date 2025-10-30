/**
 * Composants avec lazy loading pour améliorer les performances
 */
import { lazy, Suspense } from 'react';
import { SpinnerIcon } from './Icons';

// Composant de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <SpinnerIcon className="w-8 h-8 text-primary animate-spin" />
    <span className="ml-2 text-text-muted dark:text-text-muted-dark">Chargement...</span>
  </div>
);

// Lazy loading des composants lourds
export const LazyMessagingCenter = lazy(() => 
  import('./MessagingCenter').then(module => ({ default: module.MessagingCenter }))
);

export const LazyCalendarView = lazy(() => 
  import('./CalendarView').then(module => ({ default: module.CalendarView }))
);

export const LazyTimelineView = lazy(() => 
  import('./TimelineView').then(module => ({ default: module.TimelineView }))
);

export const LazyWeekView = lazy(() => 
  import('./WeekView').then(module => ({ default: module.WeekView }))
);

export const LazyStatistics = lazy(() => 
  import('./Statistics').then(module => ({ default: module.Statistics }))
);

export const LazyArchive = lazy(() => 
  import('./Archive').then(module => ({ default: module.Archive }))
);

export const LazySettings = lazy(() => 
  import('./Settings').then(module => ({ default: module.Settings }))
);

// HOC pour wrapper les composants lazy avec Suspense
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Composants wrappés prêts à l'emploi
export const MessagingCenter = withLazyLoading(LazyMessagingCenter);
export const CalendarView = withLazyLoading(LazyCalendarView);
export const TimelineView = withLazyLoading(LazyTimelineView);
export const WeekView = withLazyLoading(LazyWeekView);
export const Statistics = withLazyLoading(LazyStatistics);
export const Archive = withLazyLoading(LazyArchive);
export const Settings = withLazyLoading(LazySettings);