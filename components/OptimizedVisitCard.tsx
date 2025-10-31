import React, { memo, useMemo, useCallback } from 'react';
import { Visit } from '../types';
import { UnifiedVisitCard } from './UnifiedVisitCard';
import { useImageOptimization } from '../utils/performance-optimizations';

interface OptimizedVisitCardProps {
  visit: Visit;
  onEdit: (visit: Visit) => void;
  onDelete: (visitId: string) => void;
  onComplete: (visit: Visit) => void;
  onOpenMessageGenerator: (visit: Visit, role: 'speaker' | 'host', messageType?: string) => void;
  viewMode: 'cards' | 'list';
}

// Mémoisation avec comparaison personnalisée pour éviter les re-renders inutiles
const OptimizedVisitCard = memo<OptimizedVisitCardProps>(({
  visit,
  onEdit,
  onDelete,
  onComplete,
  onOpenMessageGenerator,
  viewMode
}) => {
  const { preloadImage, isImageLoaded } = useImageOptimization();

  // Précharger l'image si elle existe
  React.useEffect(() => {
    if (visit.photoUrl && !isImageLoaded(visit.photoUrl)) {
      preloadImage(visit.photoUrl).catch(() => {
        // Ignorer les erreurs de préchargement
      });
    }
  }, [visit.photoUrl, preloadImage, isImageLoaded]);

  // Mémoiser les handlers pour éviter les re-renders des enfants
  const handleEdit = useCallback(() => onEdit(visit), [onEdit, visit]);
  const handleDelete = useCallback(() => onDelete(visit.visitId), [onDelete, visit.visitId]);
  const handleComplete = useCallback(() => onComplete(visit), [onComplete, visit]);
  const handleOpenMessageGenerator = useCallback(
    (role: 'speaker' | 'host', messageType?: string) => 
      onOpenMessageGenerator(visit, role, messageType),
    [onOpenMessageGenerator, visit]
  );

  // Calculer les propriétés dérivées une seule fois
  const derivedProps = useMemo(() => {
    const visitDate = new Date(visit.visitDate);
    const today = new Date();
    const isToday = visitDate.toDateString() === today.toDateString();
    const isPast = visitDate < today;
    const daysUntilVisit = Math.ceil((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isToday,
      isPast,
      daysUntilVisit,
      formattedDate: visitDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }, [visit.visitDate]);

  return (
    <UnifiedVisitCard
      visit={visit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onComplete={handleComplete}
      onOpenMessageGenerator={handleOpenMessageGenerator}
      viewMode={viewMode}
      derivedProps={derivedProps}
    />
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.visit.visitId === nextProps.visit.visitId &&
    prevProps.visit.status === nextProps.visit.status &&
    prevProps.visit.visitDate === nextProps.visit.visitDate &&
    prevProps.visit.nom === nextProps.visit.nom &&
    prevProps.visit.photoUrl === nextProps.visit.photoUrl &&
    prevProps.viewMode === nextProps.viewMode &&
    // Comparer les fonctions par référence (elles devraient être stables)
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onComplete === nextProps.onComplete &&
    prevProps.onOpenMessageGenerator === nextProps.onOpenMessageGenerator
  );
});

OptimizedVisitCard.displayName = 'OptimizedVisitCard';

export { OptimizedVisitCard };