import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Speaker, Visit, MessageRole, Language, Host, MessageType, TalkHistory, ViewMode, Tab } from './types';
import { MainLayout } from './components/MainLayout';
import { UpcomingVisits } from './components/UpcomingVisits';
import { SpeakerList } from './components/SpeakerList';
import { ScheduleVisitModal } from './components/ScheduleVisitModal';
// Lazy loaded components for performance
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const CalendarView = React.lazy(() => import('./components/CalendarView').then(module => ({ default: module.CalendarView })));
const MessagingCenter = React.lazy(() => import('./components/MessagingCenter').then(module => ({ default: module.MessagingCenter })));
const TalksManager = React.lazy(() => import('./components/TalksManager').then(module => ({ default: module.TalksManager })));
const Statistics = React.lazy(() => import('./components/Statistics').then(module => ({ default: module.Statistics })));
const Settings = React.lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));

import { SpeakerDetailsModal } from './components/SpeakerDetailsModal';
import { CalendarIcon, ListViewIcon, EnvelopeIcon, CogIcon, MoonIcon, SunIcon, SearchIcon, DashboardIcon, BookOpenIcon, PodiumIcon, ChartBarIcon, CalendarDaysIcon, PlusIcon, UserIcon, HomeIcon, PrintIcon } from './components/Icons';
import { useToast } from './contexts/ToastContext';
import { useConfirm } from './contexts/ConfirmContext';
import { MessageGeneratorModal } from './components/MessageGeneratorModal';
import { useData } from './contexts/DataContext';
import { useSettings } from './contexts/SettingsContext';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { HostDetailsModal } from './components/HostDetailsModal';
import { HostList } from './components/HostList';
import { PastVisitsManager } from './components/PastVisitsManager';
import { TabButton } from './components/TabButton';
import { useVisitNotifications } from './hooks/useVisitNotifications';
import { Avatar } from './components/Avatar';
import { HostRequestModal } from './components/HostRequestModal';
import { TimelineView } from './components/TimelineView';
import { FeedbackModal } from './components/FeedbackModal';
import { WeekView } from './components/WeekView';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar } from '@capacitor/status-bar';
import { FAB } from './components/FAB';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { DashboardPrintLayout } from './components/DashboardPrintLayout';

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const App: React.FC = () => {
    const { 
        congregationProfile,
        upcomingVisits,
        pastUnarchivedVisits,
        deleteVisit,
        completeVisit,
        importData,
        resetData,
        speakers, 
        archivedVisits,
        hosts,
        visits,
        logoUrl
    } = useData();
    const { settings, setLanguage } = useSettings();
    
    // Modals State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState<Visit | undefined>(undefined);
    const [speakerToSchedule, setSpeakerToSchedule] = useState<Speaker | null>(null);
    
    const [isSpeakerDetailsModalOpen, setIsSpeakerDetailsModalOpen] = useState(false);
    const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

    const [isMessageGeneratorModalOpen, setIsMessageGeneratorModalOpen] = useState(false);
    const [messageModalData, setMessageModalData] = useState<{ visit?: Visit; speaker?: Speaker; host?: Host; role: MessageRole; messageType?: MessageType; initialText?: string } | null>(null);
    const [visitForThankYou, setVisitForThankYou] = useState<Visit | null>(null);

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    
    const [isHostDetailsModalOpen, setIsHostDetailsModalOpen] = useState(false);
    const [selectedHost, setSelectedHost] = useState<Host | null>(null);

    const [isHostRequestModalOpen, setIsHostRequestModalOpen] = useState(false);
    const [visitsForHostRequest, setVisitsForHostRequest] = useState<Visit[]>([]);
    
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [visitForFeedback, setVisitForFeedback] = useState<Visit | null>(null);

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // UI & Settings State
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [isImporting, setIsImporting] = useState(false);
    const [isSpeakerListExpanded, setIsSpeakerListExpanded] = useState(false);
    const [isHostListExpanded, setIsHostListExpanded] = useState(false);
    
    // FIX: Capacitor's PermissionState can include 'prompt-with-rationale'. Widening the type to handle all possible states returned by the permissions API.
    const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
    const [showNotificationBanner, setShowNotificationBanner] = useState(false);
    
    const { addToast } = useToast();
    const confirm = useConfirm();
    const speakerListRef = useRef<HTMLDivElement>(null);
    const hostListRef = useRef<HTMLDivElement>(null);
    const archiveSectionRef = useRef<HTMLDivElement>(null);

    useVisitNotifications(upcomingVisits, notificationPermission);
    
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                // On non-native platforms, this might throw.
                if (typeof LocalNotifications === 'undefined') {
                    
                    return;
                }

                const result = await LocalNotifications.checkPermissions();
                setNotificationPermission(result.display);

                const notificationPromptDismissed = localStorage.getItem('notificationPromptDismissed');
                if (result.display === 'prompt' && !notificationPromptDismissed) {
                    setShowNotificationBanner(true);
                }
            } catch (error) {
                console.error('Error checking notification permissions:', error);
                setNotificationPermission('denied');
            }
        };

        checkPermissions();
    }, []);

    useEffect(() => {
        if (congregationProfile?.name) {
            document.title = congregationProfile.name;
            const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
            if (appleTitle) {
                appleTitle.setAttribute('content', congregationProfile.name);
            }
        }
    }, [congregationProfile?.name]);

    useEffect(() => {
        const root = document.documentElement;
        root.lang = settings.language;
    }, [settings.language]);

    const handleEnableNotifications = async () => {
        try {
             if (typeof LocalNotifications === 'undefined') {
                addToast("Les notifications natives ne sont pas disponibles sur cette plateforme.", 'warning');
                return;
            }
            const result = await LocalNotifications.requestPermissions();
            setNotificationPermission(result.display);
            setShowNotificationBanner(false);
            localStorage.setItem('notificationPromptDismissed', 'true');
            if (result.display === 'granted') {
                addToast("Notifications activées ! Vous recevrez des rappels pour les prochaines visites.", 'success', 7000);
            } else {
                addToast("Notifications non activées. Gérez-les dans les paramètres de votre application.", 'warning', 7000);
            }
        } catch (e) {
            addToast("Impossible d'activer les notifications sur cet appareil.", 'error');
        }
    };
    
    const handleDismissNotificationBanner = () => {
        setShowNotificationBanner(false);
        localStorage.setItem('notificationPromptDismissed', 'true');
    };
    
    const handleOpenMessageGenerator = useCallback((visit: Visit, role: MessageRole, messageType?: MessageType, initialText?: string) => {
        setMessageModalData({ visit, role, messageType, initialText });
        setIsMessageGeneratorModalOpen(true);
    }, []);

    const handleOpenFreeFormMessage = useCallback((recipient: Speaker | Host, role: MessageRole) => {
        setMessageModalData({
            initialText: '',
            role,
            speaker: role === 'speaker' ? (recipient as Speaker) : undefined,
            host: role === 'host' ? (recipient as Host) : undefined,
        });
    }, []);

    useEffect(() => {
        if (visitForThankYou) {
            handleOpenMessageGenerator(visitForThankYou, 'speaker', 'thanks');
            setVisitForThankYou(null);
        }
    }, [visitForThankYou, handleOpenMessageGenerator]);

    const handleScheduleVisit = useCallback((speaker: Speaker) => {
        setSpeakerToSchedule(speaker);
        setEditingVisit(undefined);
        setIsScheduleModalOpen(true);
    }, []);

    const handleEditVisit = useCallback((visit: Visit) => {
        setEditingVisit(visit);
        setSpeakerToSchedule(null);
        setIsScheduleModalOpen(true);
    }, []);

    const handleDeleteVisit = useCallback(async (visitId: string) => {
        if(await confirm("Êtes-vous sûr de vouloir supprimer cette visite ?")) {
           deleteVisit(visitId);
        }
    }, [confirm, deleteVisit]);
    
    const handleCompleteVisit = useCallback(async (visit: Visit) => {
        if (!await confirm(`Voulez-vous marquer la visite de ${visit.nom} comme terminée ?\nCela mettra à jour sa date de dernière visite et retirera cette planification.`)) {
            return;
        }
        completeVisit(visit);
        setVisitForThankYou(visit);
    }, [confirm, completeVisit]);

    const handleCompleteMultipleVisits = useCallback(async (visitsToArchive: Visit[]) => {
        if (await confirm(`Voulez-vous archiver les ${visitsToArchive.length} visites sélectionnées ?\nCette action mettra à jour l'historique des orateurs.`)) {
            visitsToArchive.forEach(visit => completeVisit(visit));
            addToast(`${visitsToArchive.length} visite(s) archivée(s) avec succès.`, 'success');
        }
    }, [confirm, completeVisit, addToast]);
    
    const handleAddSpeaker = useCallback(() => {
        setSelectedSpeaker(null);
        setIsSpeakerDetailsModalOpen(true);
    }, []);

    const handleEditSpeaker = (speaker: Speaker) => {
        setSelectedSpeaker(speaker);
        setIsSpeakerDetailsModalOpen(true);
    };
    
    const handleAddHost = useCallback(() => {
        setSelectedHost(null);
        setIsHostDetailsModalOpen(true);
    }, []);

    const handleEditHost = (host: Host) => {
        setSelectedHost(host);
        setIsHostDetailsModalOpen(true);
    };

    const handleOpenHostRequestModal = useCallback((visits: Visit[]) => {
        setVisitsForHostRequest(visits);
        setIsHostRequestModalOpen(true);
    }, []);

    const handleOpenFeedbackModal = useCallback((visit: Visit) => {
        setVisitForFeedback(visit);
        setIsFeedbackModalOpen(true);
    }, []);
    
    const handleImportData = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (await confirm("Êtes-vous sûr de vouloir importer ces données ? Cela écrasera toutes les données actuelles.")) {
            setIsImporting(true);
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                importData(data);
            } catch (error) {
                console.error("Failed to import data:", error);
                addToast(`Erreur lors de l'importation : ${error instanceof Error ? error.message : 'Format non valide.'}`, 'error');
            } finally {
                setIsImporting(false);
                event.target.value = '';
            }
        } else {
             event.target.value = '';
        }
    }, [confirm, addToast, importData]);
    
    const handleResetData = useCallback(async () => {
        if (await confirm("ATTENTION : Cette action est irréversible.\nToutes les visites, orateurs et frères pour l'accueil seront supprimés. Voulez-vous continuer ?")) {
            resetData();
        }
    }, [confirm, resetData]);

    const handleScheduleFromShortcut = useCallback(() => {
        setActiveTab('planning');
        setIsSpeakerListExpanded(true);
        setTimeout(() => {
            speakerListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);
    
    const handleGoToSpeakers = useCallback(() => {
        setActiveTab('planning');
        setIsSpeakerListExpanded(true);
        setTimeout(() => {
            speakerListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);

    const handleGoToHosts = useCallback(() => {
        setActiveTab('planning');
        setIsHostListExpanded(true);
        setTimeout(() => {
            hostListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);
    
    const handleGoToPlanning = useCallback(() => {
        setActiveTab('planning');
    }, []);

    const handleGoToSettings = useCallback(() => {
        setActiveTab('settings');
        setTimeout(() => {
            const archiveSection = archiveSectionRef.current;
            if (archiveSection) {
                archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const expandButton = archiveSection.querySelector('[role="button"]') as HTMLElement;
                if (expandButton && expandButton.getAttribute('aria-expanded') === 'false') {
                    expandButton.click();
                }
            }
        }, 150);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (action) {
            setTimeout(() => {
                if (action === 'schedule') {
                    handleScheduleFromShortcut();
                } else if (action === 'add_speaker') {
                    handleAddSpeaker();
                } else if (action === 'add_host') {
                    handleAddHost();
                }
                if (window.history.replaceState) {
                    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                }
            }, 100);
        }
    }, [handleScheduleFromShortcut, handleAddSpeaker, handleAddHost]);

    const fabActions = useMemo(() => [
        { label: "Programmer une visite", icon: PlusIcon, onClick: handleScheduleFromShortcut },
        { label: "Ajouter un orateur", icon: UserIcon, onClick: handleAddSpeaker },
        { label: "Ajouter un contact", icon: HomeIcon, onClick: handleAddHost },
    ], [handleScheduleFromShortcut, handleAddSpeaker, handleAddHost]);

    const renderPlanningContent = () => {
        switch(viewMode) {
            case 'week':
                return <WeekView onEditVisit={handleEditVisit} />;
            case 'timeline':
                return <TimelineView onEditVisit={handleEditVisit} />;
            case 'calendar':
                return <CalendarView onEditVisit={handleEditVisit} />;
            case 'cards':
            case 'list':
                return <UpcomingVisits
                    visits={upcomingVisits}
                    onEdit={handleEditVisit}
                    onDelete={handleDeleteVisit}
                    onComplete={handleCompleteVisit}
                    onOpenMessageGenerator={handleOpenMessageGenerator}
                    onScheduleFirst={handleScheduleFromShortcut}
                    viewMode={viewMode}
                />;
            default:
                return null;
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard 
                    onScheduleVisitClick={handleScheduleFromShortcut}
                    onAddSpeakerClick={handleAddSpeaker}
                    onAddHostClick={handleAddHost}
                    onEditVisitClick={handleEditVisit}
                    onOpenMessageGenerator={handleOpenMessageGenerator}
                    onOpenHostRequestModal={handleOpenHostRequestModal}
                    setActiveTab={setActiveTab}
                    onGoToSpeakers={handleGoToSpeakers}
                    onGoToHosts={handleGoToHosts}
                    onGoToPlanning={handleGoToPlanning}
                    onGoToSettings={handleGoToSettings}
                    onLeaveFeedback={handleOpenFeedbackModal}
                />;
            case 'planning':
                return (
                    <>
                        <PastVisitsManager
                            visits={pastUnarchivedVisits}
                            onComplete={handleCompleteVisit}
                            onCompleteMultiple={handleCompleteMultipleVisits}
                        />
                        {renderPlanningContent()}
                        <div ref={speakerListRef} className="my-8">
                            <SpeakerList
                                onSchedule={handleScheduleVisit}
                                onAddSpeaker={handleAddSpeaker}
                                onEditSpeaker={handleEditSpeaker}
                                onSendMessage={(speaker) => handleOpenFreeFormMessage(speaker, 'speaker')}
                                isExpanded={isSpeakerListExpanded}
                                onToggleExpand={() => setIsSpeakerListExpanded(prev => !prev)}
                            />
                        </div>
                        <div ref={hostListRef} className="my-8">
                            <HostList
                                onAddHost={handleAddHost}
                                onEditHost={handleEditHost}
                                onSendMessage={(host) => handleOpenFreeFormMessage(host, 'host')}
                                isExpanded={isHostListExpanded}
                                onToggleExpand={() => setIsHostListExpanded(prev => !prev)}
                            />
                        </div>
                    </>
                );
            case 'messaging':
                return <MessagingCenter
                    onOpenMessageGenerator={handleOpenMessageGenerator}
                    onOpenHostRequestModal={handleOpenHostRequestModal}
                />;
            case 'talks':
                return <TalksManager />;
            case 'statistics':
                return <Statistics />;
            case 'settings':
                return <Settings
                    onImport={handleImportData}
                    onResetData={handleResetData}
                    isImporting={isImporting}
                    onLeaveFeedback={handleOpenFeedbackModal}
                    archiveSectionRef={archiveSectionRef as any}
                />;
            default:
                return null;
        }
    };

    return (
        <>
            <MainLayout
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                congregationProfile={congregationProfile}
                logoUrl={logoUrl}
                showNotificationBanner={showNotificationBanner}
                onEnableNotifications={handleEnableNotifications}
                onDismissNotificationBanner={handleDismissNotificationBanner}
                onOpenSearch={() => setIsSearchModalOpen(true)}
                onOpenPrint={() => setIsPrintModalOpen(true)}
            >
                <React.Suspense fallback={<PageLoader />}>
                    <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                                {activeTab === 'planning' && (
                                <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-4 pt-4 sm:pt-0 no-print">
                                        <div className="flex items-center rounded-lg p-1 bg-gray-200 dark:bg-primary-light/20 overflow-x-auto hide-scrollbar">
                                        <button onClick={() => setViewMode('cards')} className={`whitespace-nowrap px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'cards' ? 'bg-white dark:bg-card-dark shadow-md' : ''}`}>
                                            <DashboardIcon className="w-5 h-5" /> Cartes
                                        </button>
                                        <button onClick={() => setViewMode('list')} className={`whitespace-nowrap px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-card-dark shadow-md' : ''}`}>
                                            <ListViewIcon className="w-5 h-5" /> Liste
                                        </button>
                                        <button onClick={() => setViewMode('week')} className={`whitespace-nowrap px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'week' ? 'bg-white dark:bg-card-dark shadow-md' : ''}`}>
                                            <CalendarDaysIcon className="w-5 h-5" /> Semaine
                                        </button>
                                        <button onClick={() => setViewMode('calendar')} className={`whitespace-nowrap px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-card-dark shadow-md' : ''}`}>
                                            <CalendarIcon className="w-5 h-5" /> Calendrier
                                        </button>
                                        <button onClick={() => setViewMode('timeline')} className={`whitespace-nowrap px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-white dark:bg-card-dark shadow-md' : ''}`}>
                                            <ChartBarIcon className="w-5 h-5" /> Chronologie
                                        </button>
                                    </div>
                                </div>
                            )}
                            {renderContent()}
                        </div>
                </React.Suspense>
            </MainLayout>

                        
            {/* Modals are rendered here, outside of the main layout div to ensure they are on top of everything */}
            {isScheduleModalOpen && (
                <ScheduleVisitModal 
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    editingVisit={editingVisit}
                    speaker={speakerToSchedule}
                    onSave={handleCompleteVisit}
                />
            )}
            {isSpeakerDetailsModalOpen && (
                    <SpeakerDetailsModal 
                    isOpen={isSpeakerDetailsModalOpen}
                    onClose={() => setIsSpeakerDetailsModalOpen(false)}
                    speaker={selectedSpeaker}
                />
            )}
            {isMessageGeneratorModalOpen && messageModalData && (
                    <MessageGeneratorModal
                    isOpen={isMessageGeneratorModalOpen}
                    onClose={() => setIsMessageGeneratorModalOpen(false)}
                    {...messageModalData}
                    language={settings.language}
                    onLanguageChange={setLanguage}
                />
            )}
            {isSearchModalOpen && (
                <GlobalSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onEditVisit={visit => { setIsSearchModalOpen(false); handleEditVisit(visit); }}
                    onEditSpeaker={speaker => { setIsSearchModalOpen(false); handleEditSpeaker(speaker); }}
                    onEditHost={host => { setIsSearchModalOpen(false); handleEditHost(host); }}
                />
            )}
            {isHostDetailsModalOpen && (
                <HostDetailsModal
                    isOpen={isHostDetailsModalOpen}
                    onClose={() => setIsHostDetailsModalOpen(false)}
                    host={selectedHost}
                />
            )}
            {isHostRequestModalOpen && (
                <HostRequestModal
                    isOpen={isHostRequestModalOpen}
                    onClose={() => setIsHostRequestModalOpen(false)}
                    visits={visitsForHostRequest}
                    language={settings.language}
                    onLanguageChange={setLanguage}
                />
            )}
            {isFeedbackModalOpen && visitForFeedback && (
                <FeedbackModal
                    isOpen={isFeedbackModalOpen}
                    onClose={() => setIsFeedbackModalOpen(false)}
                    visit={visitForFeedback}
                />
            )}
             {isPrintModalOpen && (
                <PrintPreviewModal onClose={() => setIsPrintModalOpen(false)}>
                    <DashboardPrintLayout 
                        speakers={speakers}
                        hosts={hosts}
                        upcomingVisits={upcomingVisits}
                        archivedVisits={archivedVisits}
                        congregationProfile={congregationProfile}
                    />
                </PrintPreviewModal>
            )}
        </>
    );
};

export default App;

