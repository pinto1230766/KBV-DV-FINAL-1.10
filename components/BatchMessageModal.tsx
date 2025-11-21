import React, { useState, useEffect } from 'react';
import { Visit, MessageType, MessageRole, Language } from '../types';
import { useData } from '../contexts/DataContext';
import { messageTemplates } from '../constants';

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
  const { customTemplates } = useData();
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [messageType, setMessageType] = useState<MessageType>('confirmation');
  const [messageRole, setMessageRole] = useState<MessageRole>('speaker');
  const [language, setLanguage] = useState<Language>('fr');
  const [customMessage, setCustomMessage] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState('');

  useEffect(() => {
    if (isOpen) {
        // Select all by default when opening
        setSelectedVisits(new Set(visits.filter(v => v.status !== 'cancelled').map(v => v.visitId)));
    }
  }, [isOpen, visits]);

  useEffect(() => {
    // Update generated template when parameters change
    const custom = customTemplates[language]?.[messageType]?.[messageRole];
    const defaultTpl = messageTemplates[language]?.[messageType]?.[messageRole] || "";
    setGeneratedTemplate(custom || defaultTpl);
    setCustomMessage(''); // Reset custom message override when template changes
  }, [messageType, messageRole, language, customTemplates]);

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
    setSelectedVisits(new Set(visits.filter(v => v.status !== 'cancelled').map(v => v.visitId)));
  };

  const selectNone = () => {
    setSelectedVisits(new Set());
  };

  const getMessageContent = (visit: Visit) => {
      if (customMessage) return customMessage;

      let content = generatedTemplate;
      
      // Basic variable replacement
      const dateStr = new Date(visit.visitDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'pt-PT');
      const timeStr = visit.visitTime;
      
      content = content.replace(/{date}/g, dateStr);
      content = content.replace(/{heure}/g, timeStr);
      content = content.replace(/{congregation}/g, visit.congregation);
      content = content.replace(/{orateur}/g, visit.nom);
      content = content.replace(/{theme}/g, visit.talkTheme || "(Thème à définir)");
      content = content.replace(/{numero}/g, visit.talkNoOrType || "?");
      
      return content;
  };

  const sendMessages = () => {
    if (selectedVisits.size === 0) return;

    const messages: { recipient: string; message: string; phone?: string }[] = [];

    visits.forEach(visit => {
      if (selectedVisits.has(visit.visitId)) {
        const recipient = messageRole === 'speaker' ? visit.nom : visit.host;
        const phone = messageRole === 'speaker' ? visit.telephone : undefined; // Host phone might need to be fetched if not on visit object

        messages.push({
          recipient,
          message: getMessageContent(visit),
          phone
        });
      }
    });

    onSendMessages(messages);
    onClose();
  };

  if (!isOpen) return null;

  const filteredVisits = visits.filter(v => v.status !== 'cancelled');
  const previewVisit = visits.find(v => selectedVisits.has(v.visitId)) || visits[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Envoi de Messages Groupés
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {/* Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de Message
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as MessageType)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                  className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 transition-colors"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={selectNone}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                >
                  Aucun
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
              {filteredVisits.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">Aucune visite disponible.</div>
              ) : (
                  filteredVisits.map(visit => (
                    <div
                      key={visit.visitId}
                      className={`flex items-center p-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0 cursor-pointer transition-colors ${selectedVisits.has(visit.visitId) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      onClick={() => toggleVisitSelection(visit.visitId)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVisits.has(visit.visitId)}
                        onChange={() => {}} // Handled by parent div click
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {messageRole === 'speaker' ? visit.nom : visit.host} <span className={`text-xs px-2 py-0.5 rounded-full ${visit.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{visit.status}</span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(visit.visitDate).toLocaleDateString('fr-FR')} - {visit.congregation}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message (Modifiable)
            </label>
            <textarea
              value={customMessage || generatedTemplate}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Le modèle de message apparaîtra ici..."
              className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white h-32 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Variables disponibles: {'{date}'}, {'{heure}'}, {'{congregation}'}, {'{orateur}'}, {'{theme}'}, {'{numero}'}.
            </p>
          </div>

          {/* Preview */}
          {selectedVisits.size > 0 && previewVisit && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <span>👁️</span> Aperçu pour {messageRole === 'speaker' ? previewVisit.nom : previewVisit.host}
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-mono bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-700">
                {getMessageContent(previewVisit)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={sendMessages}
            disabled={selectedVisits.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
          >
            Envoyer {selectedVisits.size} message{selectedVisits.size > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchMessageModal;
