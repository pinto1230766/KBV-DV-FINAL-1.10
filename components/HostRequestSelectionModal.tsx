import React, { useState, useMemo } from 'react';
import { Visit } from '../types';
import { XIcon, HomeIcon, CheckIcon } from './Icons';
import { Avatar } from './Avatar';
import { UNASSIGNED_HOST } from '../constants';

interface HostRequestSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedVisits: Visit[]) => void;
  availableVisits: Visit[];
}

export const HostRequestSelectionModal: React.FC<HostRequestSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  availableVisits
}) => {
  // Pas de pré-sélection - l'utilisateur coche manuellement
  const [selectedVisitIds, setSelectedVisitIds] = useState<Set<string>>(new Set());

  const toggleVisit = (visitId: string) => {
    setSelectedVisitIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitId)) {
        newSet.delete(visitId);
      } else {
        newSet.add(visitId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selected = availableVisits.filter(v => selectedVisitIds.has(v.visitId));
    if (selected.length > 0) {
      onConfirm(selected);
      onClose();
    }
  };

  const selectedCount = selectedVisitIds.size;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <HomeIcon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Demande d'accueil groupée</h2>
            </div>
            <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full text-white/70 hover:bg-white/20">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-white/90 text-sm">
            Sélectionnez les visites pour lesquelles vous cherchez un hébergement
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {availableVisits.length === 0 ? (
            <div className="text-center py-12">
              <HomeIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-text-muted dark:text-text-muted-dark">
                Aucune visite disponible pour une demande d'accueil
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableVisits.map(visit => {
                const isSelected = selectedVisitIds.has(visit.visitId);
                const needsHost = visit.host === UNASSIGNED_HOST;
                
                return (
                  <button
                    key={visit.visitId}
                    onClick={() => toggleVisit(visit.visitId)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-border-light dark:border-border-dark hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
                      </div>

                      {/* Avatar */}
                      <Avatar item={visit} size="w-12 h-12" />

                      {/* Visit Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-text-main dark:text-text-main-dark truncate">
                            {visit.nom}
                          </p>
                          {needsHost && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full">
                              À définir
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted dark:text-text-muted-dark">
                          {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1">
                          {visit.congregation}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-background-dark px-6 py-4 flex justify-between items-center border-t border-border-light dark:border-border-dark rounded-b-xl">
          <p className="text-sm text-text-muted dark:text-text-muted-dark">
            {selectedCount} visite{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-main dark:text-text-main-dark font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-primary-light/20 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="px-6 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
            >
              Générer le message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
