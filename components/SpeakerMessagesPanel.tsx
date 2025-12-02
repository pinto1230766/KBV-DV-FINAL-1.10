import React, { useState, useMemo } from 'react';
import { Speaker, SpeakerMessage } from '../types';
import { useData } from '../contexts/DataContext';
import { NotificationService } from '../utils/notificationService';
import { useToast } from '../contexts/ToastContext';
import { 
  WhatsAppIcon, 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  SearchIcon,
  XIcon 
} from './Icons';

export const SpeakerMessagesPanel: React.FC = () => {
  const { speakers, speakerMessages, addSpeakerMessage, markMessageAsRead, deleteSpeakerMessage } = useData();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filtrer les orateurs qui ont un numéro de téléphone
  const speakersWithPhone = useMemo(() => {
    return speakers.filter(s => s.telephone && s.telephone.trim() !== '');
  }, [speakers]);

  // Filtrer selon la recherche
  const filteredSpeakers = useMemo(() => {
    let filtered = speakersWithPhone;

    const searchTermNormalized = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchTermNormalized) ||
        s.congregation.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchTermNormalized)
      );
    }

    return filtered.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [speakersWithPhone, searchTerm]);

  // Messages non lus
  const unreadMessages = useMemo(() => {
    return speakerMessages.filter(m => !m.read);
  }, [speakerMessages]);

  // Vérifier si un orateur a des messages non lus
  const hasUnreadMessage = (speakerId: string): boolean => {
    return speakerMessages.some(m => m.speakerId === speakerId && !m.read);
  };

  // Marquer qu'un message a été reçu
  const handleMessageReceived = async (speaker: Speaker) => {
    if (!speaker.telephone) {
      addToast('Aucun numéro de téléphone pour cet orateur', 'error');
      return;
    }

    // Ajouter le message
    await addSpeakerMessage(speaker.id, speaker.nom, speaker.telephone);

    // Afficher la notification
    await NotificationService.showSpeakerMessageNotification(
      speaker.nom,
      speaker.id,
      speaker.telephone
    );

    addToast(`Message de ${speaker.nom} enregistré !`, 'success');
  };

  // Ouvrir WhatsApp
  const handleOpenWhatsApp = (speaker: Speaker) => {
    if (!speaker.telephone) {
      addToast('Aucun numéro de téléphone pour cet orateur', 'error');
      return;
    }

    NotificationService.openWhatsApp(speaker.telephone);
  };

  // Marquer comme lu
  const handleMarkAsRead = async (messageId: string) => {
    await markMessageAsRead(messageId);
    addToast('Message marqué comme lu', 'success');
  };

  // Supprimer un message
  const handleDeleteMessage = async (messageId: string) => {
    await deleteSpeakerMessage(messageId);
    addToast('Message supprimé', 'success');
  };

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary dark:from-primary-dark dark:to-secondary text-white p-6 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-2">💬 Messages WhatsApp</h1>
        <p className="text-white/80">
          Gérez les messages reçus des orateurs
        </p>
        {unreadMessages.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
            <BellIcon className="w-4 h-4" />
            <span>{unreadMessages.length} message{unreadMessages.length > 1 ? 's' : ''} non lu{unreadMessages.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="p-4 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un orateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-primary-light/10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <XIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filtre non lus */}
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showUnreadOnly
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-primary-light/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            {showUnreadOnly ? 'Tous' : 'Non lus'}
          </button>
        </div>
      </div>

      {/* Liste des orateurs */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredSpeakers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun orateur trouvé</p>
            <p className="text-sm mt-2">Essayez de modifier votre recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSpeakers.map((speaker) => {
              const unread = hasUnreadMessage(speaker.id);
              const speakerUnreadMessages = speakerMessages.filter(
                m => m.speakerId === speaker.id && !m.read
              );

              if (showUnreadOnly && !unread) return null;

              return (
                <div
                  key={speaker.id}
                  className={`bg-card-light dark:bg-card-dark rounded-lg shadow-md p-4 border-2 transition-all ${
                    unread
                      ? 'border-primary dark:border-primary-light'
                      : 'border-transparent'
                  }`}
                >
                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-text-main dark:text-text-main-dark">
                        {speaker.nom}
                      </h3>
                      <p className="text-sm text-text-muted dark:text-text-muted-dark">
                        {speaker.congregation}
                      </p>
                    </div>
                    {unread && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {speakerUnreadMessages.length}
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMessageReceived(speaker)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                    >
                      <BellIcon className="w-4 h-4" />
                      <span>Message reçu</span>
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(speaker)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Ouvrir WhatsApp"
                    >
                      <WhatsAppIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages non lus */}
                  {speakerUnreadMessages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
                      <p className="text-xs font-semibold text-text-muted dark:text-text-muted-dark mb-2">
                        Messages non lus :
                      </p>
                      {speakerUnreadMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="flex items-center justify-between bg-gray-100 dark:bg-primary-light/10 rounded px-2 py-1 mb-1"
                        >
                          <span className="text-xs text-text-muted dark:text-text-muted-dark">
                            {new Date(msg.receivedAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                              title="Marquer comme lu"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
