import React, { useState, useMemo, useEffect } from 'react';
import { Visit, MessageRole, Language, MessageType } from '../types';
import { useData } from '../contexts/DataContext';
import {
    SearchIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    EnvelopeIcon,
    HomeIcon,
} from './Icons';
import { UNASSIGNED_HOST } from '../constants';
import { Avatar } from './Avatar';
import { HostRequestSelectionModal } from './HostRequestSelectionModal';
import { PlusIcon } from './Icons';

// --- PROPS ---
interface MessagingCenterProps {
    onOpenMessageGenerator: (visit: Visit, role: MessageRole, messageType?: MessageType, initialText?: string) => void;
    onOpenHostRequestModal: (visits: Visit[]) => void;
}

// --- SUB-COMPONENTS ---
const CommunicationProgress: React.FC<{ visit: Visit }> = ({ visit }) => {
    const steps: { type: MessageType; role: MessageRole }[] = [
        { type: 'confirmation', role: 'speaker' },
        { type: 'preparation', role: 'speaker' },
        { type: 'preparation', role: 'host' },
        { type: 'reminder-7', role: 'speaker' },
        { type: 'thanks', role: 'speaker' },
    ];

    const applicableSteps = useMemo(() => steps.filter(step => {
        // Host preparation is not applicable for non-physical visits
        if (step.role === 'host' && visit.locationType !== 'physical') {
            return false;
        }
        // A reminder is a single step
        if (step.type === 'reminder-2') return false; 
        return true;
    }), [visit.locationType]);
    
    const completedSteps = useMemo(() => applicableSteps.filter(step => {
         // A reminder is complete if either J-7 or J-2 is sent
        if (step.type === 'reminder-7') {
            return visit.communicationStatus?.['reminder-7']?.[step.role] || visit.communicationStatus?.['reminder-2']?.[step.role];
        }
        return visit.communicationStatus?.[step.type]?.[step.role];
    }), [applicableSteps, visit.communicationStatus]);
    
    const progress = applicableSteps.length > 0 ? (completedSteps.length / applicableSteps.length) * 100 : 100;

    return (
        <div className="w-full bg-gray-200 dark:bg-primary-light/20 rounded-full h-1.5 mt-2 group-hover:bg-gray-300 dark:group-hover:bg-primary-light/30 transition-colors">
            <div
                className="bg-secondary rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${progress}%` }}
            ></div>
            <span className="sr-only">{completedSteps.length} sur {applicableSteps.length} étapes complétées</span>
        </div>
    );
};

const ConversationListItem: React.FC<{ visit: Visit, isSelected: boolean, onSelect: () => void }> = ({ visit, isSelected, onSelect }) => {
    const isUrgent = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const visitDate = new Date(visit.visitDate + 'T00:00:00');
        const diffDays = (visitDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diffDays < 7 && (!visit.communicationStatus?.['confirmation']?.['speaker']);
    }, [visit]);

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-4 transition-all duration-200 group ${isSelected ? 'bg-secondary text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-primary-light/10'}`}
        >
            <Avatar item={visit} size="w-12 h-12" />
            <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center">
                    <p className={`font-bold truncate ${isSelected ? 'text-white' : 'text-text-main dark:text-text-main-dark'}`}>{visit.nom}</p>
                    {isUrgent && <span className="w-2.5 h-2.5 bg-highlight rounded-full flex-shrink-0 animate-pulse-slow" title="Action requise"></span>}
                </div>
                <p className={`text-sm capitalize ${isSelected ? 'text-white/80' : 'text-text-muted dark:text-text-muted-dark'}`}>
                    {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}
                </p>
                <CommunicationProgress visit={visit} />
            </div>
        </button>
    );
};

const CommunicationStep: React.FC<{ visit: Visit; type: MessageType; role: MessageRole; label: string; onOpen: () => void }> = ({ visit, type, role, label, onOpen }) => {
    const isSent = !!visit.communicationStatus?.[type]?.[role];
    const isApplicable = !(role === 'host' && visit.locationType !== 'physical');

    if (!isApplicable) return null;

    const dateSent = isSent ? new Date(visit.communicationStatus![type]![role]!).toLocaleDateString('fr-FR') : null;

    return (
        <div className={`p-4 rounded-lg flex items-center justify-between gap-4 transition-colors ${isSent ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-primary-light/10'}`}>
            <div className="flex items-center gap-3">
                {isSent 
                    ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" /> 
                    : <EnvelopeIcon className="w-6 h-6 text-text-muted dark:text-text-muted-dark flex-shrink-0" />
                }
                <div>
                    <p className="font-semibold text-text-main dark:text-text-main-dark">{label}</p>
                    {isSent && <p className="text-xs text-green-700 dark:text-green-300 font-medium">Envoyé le {dateSent}</p>}
                </div>
            </div>
            {!isSent && (
                <button onClick={onOpen} className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-light transition-transform active:scale-95">
                    Générer
                </button>
            )}
        </div>
    );
};

const ConversationDetailView: React.FC<{ visit: Visit, onOpenMessageGenerator: MessagingCenterProps['onOpenMessageGenerator'], onBack: () => void, isMobile: boolean }> = ({ visit, onOpenMessageGenerator, onBack, isMobile }) => {
    const [personalMessage, setPersonalMessage] = useState('');

    const handleOpenPersonalMessage = () => {
        if (personalMessage.trim()) {
            onOpenMessageGenerator(visit, 'speaker', undefined, personalMessage);
            setPersonalMessage('');
        }
    };

    return (
        <div className="flex flex-col bg-card-light dark:bg-card-dark rounded-xl shadow-soft-lg h-full">
            {/* Header */}
            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center gap-4 flex-shrink-0">
                {isMobile && (
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary-light/20">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                )}
                <Avatar item={visit} size="w-10 h-10" />
                <div>
                    <h3 className="text-lg font-bold text-primary dark:text-white">{visit.nom}</h3>
                    <p className="text-sm text-text-muted dark:text-text-muted-dark capitalize">
                        {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>
            {/* Content */}
            <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
                <div>
                    <h4 className="font-bold text-text-main dark:text-text-main-dark mb-3">Communications Orateur</h4>
                    <div className="space-y-3">
                        <CommunicationStep visit={visit} type="confirmation" role="speaker" label="Confirmation & Besoins" onOpen={() => onOpenMessageGenerator(visit, 'speaker', 'confirmation')} />
                        <CommunicationStep visit={visit} type="preparation" role="speaker" label="Détails de préparation" onOpen={() => onOpenMessageGenerator(visit, 'speaker', 'preparation')} />
                        <CommunicationStep visit={visit} type="reminder-7" role="speaker" label="Rappel J-7" onOpen={() => onOpenMessageGenerator(visit, 'speaker', 'reminder-7')} />
                        <CommunicationStep visit={visit} type="reminder-2" role="speaker" label="Rappel J-2" onOpen={() => onOpenMessageGenerator(visit, 'speaker', 'reminder-2')} />
                        <CommunicationStep visit={visit} type="thanks" role="speaker" label="Remerciements" onOpen={() => onOpenMessageGenerator(visit, 'speaker', 'thanks')} />
                    </div>
                </div>

                <div className="pt-6 border-t border-border-light dark:border-border-dark">
                    <h4 className="font-bold text-text-main dark:text-text-main-dark mb-3">Communication Personnalisée (Orateur)</h4>
                     <div className="bg-gray-100 dark:bg-primary-light/10 rounded-lg p-4">
                        <textarea
                            value={personalMessage}
                            onChange={(e) => setPersonalMessage(e.target.value)}
                            rows={4}
                            placeholder="Écrivez votre message personnalisé ici pour des situations spécifiques (ex: invitation à un repas par une autre famille, etc.)."
                            className="w-full p-2 border rounded-md bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark"
                        />
                        <div className="text-right mt-2">
                             <button
                                onClick={handleOpenPersonalMessage}
                                disabled={!personalMessage.trim()}
                                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-light transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Générer le message
                            </button>
                        </div>
                    </div>
                </div>

                 {(visit.locationType === 'physical' && visit.host !== 'N/A') && (
                    <div className="pt-6 border-t border-border-light dark:border-border-dark">
                        <h4 className="font-bold text-text-main dark:text-text-main-dark mb-3">Communications Accueil ({visit.host})</h4>
                        <div className="space-y-3">
                            <CommunicationStep visit={visit} type="confirmation" role="host" label="Confirmation" onOpen={() => onOpenMessageGenerator(visit, 'host', 'confirmation')} />
                            <CommunicationStep visit={visit} type="preparation" role="host" label="Détails de préparation" onOpen={() => onOpenMessageGenerator(visit, 'host', 'preparation')} />
                            <CommunicationStep visit={visit} type="reminder-7" role="host" label="Rappel J-7" onOpen={() => onOpenMessageGenerator(visit, 'host', 'reminder-7')} />
                             <CommunicationStep visit={visit} type="thanks" role="host" label="Remerciements" onOpen={() => onOpenMessageGenerator(visit, 'host', 'thanks')} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export const MessagingCenter: React.FC<MessagingCenterProps> = ({ onOpenMessageGenerator, onOpenHostRequestModal }) => {
    const { upcomingVisits } = useData();
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

    const activeVisits = useMemo(() => 
        upcomingVisits
            .filter(v => v.status !== 'cancelled')
            .filter(v => v.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    , [upcomingVisits, searchTerm]);
    
    const selectedVisit = useMemo(() => 
        activeVisits.find(v => v.visitId === selectedVisitId)
    , [activeVisits, selectedVisitId]);

    const visitsNeedingHost = useMemo(() =>
        upcomingVisits.filter(v =>
            v.host === UNASSIGNED_HOST &&
            v.status !== 'cancelled' &&
            v.locationType === 'physical' &&
            !v.congregation.toLowerCase().includes('lyon')
        ).sort((a,b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()),
        [upcomingVisits]
    );

    // Reset selection if the selected visit is filtered out
    useEffect(() => {
        if (selectedVisitId && !activeVisits.some(v => v.visitId === selectedVisitId)) {
            setSelectedVisitId(null);
        }
    }, [searchTerm, activeVisits, selectedVisitId]);
    
    // Select first visit by default on desktop
    useEffect(() => {
        if(window.innerWidth >= 768 && activeVisits.length > 0 && !selectedVisitId) {
            setSelectedVisitId(activeVisits[0].visitId);
        }
    }, [activeVisits, selectedVisitId]);

    return (
        <div className="flex flex-col animate-fade-in h-full">
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
                <div className="flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Rechercher une visite par nom..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-primary focus:border-primary bg-card-light dark:bg-card-dark"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        {visitsNeedingHost.length > 0 && (
                            <button
                                onClick={() => setIsSelectionModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-all active:scale-95 whitespace-nowrap shadow-md"
                                title="Demande d'accueil groupée"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Demande d'accueil</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-grow min-h-0">
                    <div className="md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 h-full">
                        {/* Mobile View */}
                        <div className="md:hidden h-full overflow-y-auto">
                            {selectedVisit ? (
                                <ConversationDetailView visit={selectedVisit} onOpenMessageGenerator={onOpenMessageGenerator} onBack={() => setSelectedVisitId(null)} isMobile={true} />
                            ) : (
                                <div className="space-y-2">
                                    {activeVisits.length > 0 ? activeVisits.map(visit => (
                                        <ConversationListItem key={visit.visitId} visit={visit} isSelected={false} onSelect={() => setSelectedVisitId(visit.visitId)} />
                                    )) : (
                                        <p className="text-center py-8 text-text-muted dark:text-text-muted-dark">Aucune visite à venir ne correspond à votre recherche.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block md:col-span-1 lg:col-span-1 pr-2 space-y-2 h-full overflow-y-auto">
                            {activeVisits.length > 0 ? activeVisits.map(visit => (
                                <ConversationListItem key={visit.visitId} visit={visit} isSelected={visit.visitId === selectedVisitId} onSelect={() => setSelectedVisitId(visit.visitId)} />
                            )) : (
                                <p className="text-center py-8 text-text-muted dark:text-text-muted-dark">Aucune visite à venir.</p>
                            )}
                        </div>
                        <div className="hidden md:block md:col-span-2 lg:col-span-3 h-full">
                            {selectedVisit ? (
                                <ConversationDetailView visit={selectedVisit} onOpenMessageGenerator={onOpenMessageGenerator} onBack={() => {}} isMobile={false} />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gray-50/50 dark:bg-card-dark/20 rounded-xl">
                                    <p className="text-text-muted dark:text-text-muted-dark">{activeVisits.length > 0 ? "Sélectionnez une conversation" : "Aucune visite à afficher"}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Modal */}
            <HostRequestSelectionModal
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                onConfirm={onOpenHostRequestModal}
                availableVisits={visitsNeedingHost}
            />
        </div>
    );
};
