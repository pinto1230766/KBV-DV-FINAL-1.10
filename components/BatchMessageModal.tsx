import React, { useState, useEffect } from 'react';
import { Visit, MessageType, MessageRole, Language } from '../types';

interface BatchMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: Visit[];
  onSendMessages: (messages: { recipient: string; message: string; phone?: string }[]) => void;
}

const BatchMessageModal: React.FC<BatchMessageModalProps> = ({
  isOpen,
  onClose,
  visits,
  onSendMessages
}) => {
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [messageType, setMessageType] = useState<MessageType>('confirmation');
  const [messageRole, setMessageRole] = useState<MessageRole>('speaker');
  const [language, setLanguage] = useState<Language>('fr');
  const [customMessage, setCustomMessage] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    // Reset generation state when parameters change
    setIsGenerated(false);
  }, [messageType, messageRole, language, selectedVisits]);

  const toggleVisitSelection = (visitId: string) => {
    const newSelection = new Set(selectedVisits);
    if (newSelection.has(visitId)) {
      newSelection.delete(visitId);
    } else {
      newSelection.add(visitId);
    }
    setSelectedVisits(newSelection);
  };

  const selectAll = () => {
    setSelectedVisits(new Set(visits.map(v => v.visitId)));
  };

  const selectNone = () => {
    setSelectedVisits(new Set());
  };

  const generateMessages = async () => {
    if (selectedVisits.size === 0) return;

    // This would typically call an AI service or use templates
    // For now, we'll create a basic implementation
    setIsGenerated(true);
  };

  const sendMessages = () => {
    if (!isGenerated || selectedVisits.size === 0) return;

    const messages: { recipient: string; message: string; phone?: string }[] = [];

    visits.forEach(visit => {
      if (selectedVisits.has(visit.visitId)) {
        const recipient = messageRole === 'speaker' ? visit.nom : visit.host;
        const phone = messageRole === 'speaker' ? visit.telephone : undefined; // Host phone not stored in visit

        messages.push({
          recipient,
          message: customMessage || `Message ${messageType} concernant la visite du ${new Date(visit.visitDate).toLocaleDateString('fr-FR')}`,
          phone
        });
      }
    });

    onSendMessages(messages);
    onClose();
  };

  if (!isOpen) return null;

  const filteredVisits = visits.filter(v => v.status !== 'cancelled');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Messages en Lot
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de Message
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as MessageType)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="confirmation">Confirmation</option>
                <option value="preparation">Préparation</option>
                <option value="reminder-7">Rappel J-7</option>
                <option value="reminder-2">Rappel J-2</option>
                <option value="thanks">Remerciements</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destinataire
              </label>
              <select
                value={messageRole}
                onChange={(e) => setMessageRole(e.target.value as MessageRole)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="speaker">Orateur</option>
                <option value="host">Hôte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Langue
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="fr">Français</option>
                <option value="cv">Cap-Vertien</option>
              </select>
            </div>
          </div>

          {/* Visit Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Visites à contacter ({selectedVisits.size} sélectionnée(s))
              </label>
              <div className="space-x-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  Aucun
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
              {filteredVisits.map(visit => (
                <div
                  key={visit.visitId}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedVisits.has(visit.visitId)}
                    onChange={() => toggleVisitSelection(visit.visitId)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {messageRole === 'speaker' ? visit.nom : visit.host} ({visit.status})
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(visit.visitDate).toLocaleDateString('fr-FR')} - {visit.congregation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message personnalisé (optionnel)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Laissez vide pour utiliser le message généré automatiquement"
              className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24"
            />
          </div>

          {/* Preview */}
          {selectedVisits.size > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Aperçu ({selectedVisits.size} messages seront envoyés)
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {customMessage || 'Message automatique basé sur les critères sélectionnés'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            onClick={sendMessages}
            disabled={!isGenerated && selectedVisits.size > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer {selectedVisits.size} message{selectedVisits.size > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchMessageModal;
