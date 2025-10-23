import React, { useState, useMemo, useCallback } from 'react';
import { Visit } from '../types';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { FeedbackModal } from './FeedbackModal';
import { TrashIcon, EditIcon, ChatBubbleOvalLeftEllipsisIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MapPinIcon, UserIcon, HomeIcon, CalendarIcon, BookOpenIcon, VideoCameraIcon, WifiIcon } from './Icons';

interface PlanningPageProps {
  onEditVisit: (visit: Visit) => void;
  onSendMessage: (visit: Visit) => void;
}

const PlanningPage: React.FC<PlanningPageProps> = ({ onEditVisit, onSendMessage }) => {
  const { upcomingVisits, deleteVisit, completeVisit } = useData();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [sortBy, setSortBy] = useState<'date' | 'speaker' | 'congregation' | 'host'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<Visit['status'] | 'all'>('all');
  const [filterLocationType, setFilterLocationType] = useState<Visit['locationType'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [visitForFeedback, setVisitForFeedback] = useState<Visit | null>(null);

  const sortedAndFilteredVisits = useMemo(() => {
    const filtered = upcomingVisits.filter(visit => {
      const matchesStatus = filterStatus === 'all' || visit.status === filterStatus;
      const matchesLocation = filterLocationType === 'all' || visit.locationType === filterLocationType;
      const matchesSearch = searchTerm === '' ||
        visit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.congregation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.host.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesLocation && matchesSearch;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime();
          break;
        case 'speaker':
          comparison = a.nom.localeCompare(b.nom);
          break;
        case 'congregation':
          comparison = a.congregation.localeCompare(b.congregation);
          break;
        case 'host':
          comparison = a.host.localeCompare(b.host);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [upcomingVisits, sortBy, sortOrder, filterStatus, filterLocationType, searchTerm]);

  const handleDelete = useCallback(async (visit: Visit) => {
    if (await confirm(`Êtes-vous sûr de vouloir supprimer la visite de ${visit.nom} le ${formatDate(visit.visitDate)} ?`)) {
      deleteVisit(visit.visitId);
      addToast('Visite supprimée avec succès.', 'success');
    }
  }, [confirm, deleteVisit, addToast]);

  const handleComplete = useCallback(async (visit: Visit) => {
    if (await confirm(`Marquer la visite de ${visit.nom} comme terminée ? Cela l'archivera.`)) {
      completeVisit(visit);
      setVisitForFeedback(visit);
      setIsFeedbackModalOpen(true);
      addToast('Visite marquée comme terminée.', 'success');
    }
  }, [confirm, completeVisit, addToast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: Visit['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLocationIcon = (locationType: Visit['locationType']) => {
    switch (locationType) {
      case 'physical':
        return <MapPinIcon className="w-4 h-4 text-blue-500" />;
      case 'zoom':
        return <VideoCameraIcon className="w-4 h-4 text-purple-500" />;
      case 'streaming':
        return <WifiIcon className="w-4 h-4 text-orange-500" />;
      default:
        return <MapPinIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-text-main dark:text-text-main-dark">Planning des Visites</h1>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Visit['status'] | 'all')}
              className="px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="cancelled">Annulé</option>
            </select>
            <select
              value={filterLocationType}
              onChange={(e) => setFilterLocationType(e.target.value as Visit['locationType'] | 'all')}
              className="px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark"
            >
              <option value="all">Tous types</option>
              <option value="physical">Physique</option>
              <option value="zoom">Zoom</option>
              <option value="streaming">Streaming</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
              }}
              className="px-3 py-2 border border-border-light dark:border-border-dark rounded-md bg-card-light dark:bg-card-dark text-text-main dark:text-text-main-dark"
            >
              <option value="date-asc">Date ↑</option>
              <option value="date-desc">Date ↓</option>
              <option value="speaker-asc">Orateur ↑</option>
              <option value="speaker-desc">Orateur ↓</option>
              <option value="congregation-asc">Congrégation ↑</option>
              <option value="congregation-desc">Congrégation ↓</option>
              <option value="host-asc">Accueil ↑</option>
              <option value="host-desc">Accueil ↓</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {sortedAndFilteredVisits.length === 0 ? (
            <div className="text-center py-12 text-text-muted dark:text-text-muted-dark">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Aucune visite planifiée trouvée.</p>
              <p className="text-sm">Utilisez les filtres ou ajoutez une nouvelle visite.</p>
            </div>
          ) : (
            sortedAndFilteredVisits.map((visit) => (
              <div
                key={visit.visitId}
                className="bg-card-light dark:bg-card-dark rounded-xl shadow-soft-lg p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(visit.status)}
                        <span className="font-semibold text-text-main dark:text-text-main-dark">
                          {visit.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-text-muted dark:text-text-muted-dark">
                        {getLocationIcon(visit.locationType)}
                        <span>{visit.locationType === 'physical' ? 'Salle' : visit.locationType === 'zoom' ? 'Zoom' : 'Streaming'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span>{formatDate(visit.visitDate)} à {visit.visitTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-primary" />
                        <span>{visit.congregation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HomeIcon className="w-4 h-4 text-primary" />
                        <span>{visit.host === 'À définir' ? 'À définir' : visit.host}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-4 h-4 text-primary" />
                        <span>{visit.talkNoOrType || 'N/A'}</span>
                      </div>
                    </div>
                    {visit.notes && (
                      <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark italic">
                        {visit.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onEditVisit(visit)}
                      className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => onSendMessage(visit)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => handleComplete(visit)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Terminer
                    </button>
                    <button
                      onClick={() => handleDelete(visit)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isFeedbackModalOpen && visitForFeedback && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          visit={visitForFeedback}
        />
      )}
    </>
  );
};

export default PlanningPage;