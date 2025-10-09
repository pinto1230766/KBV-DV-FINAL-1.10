import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Speaker, Visit, MessageRole, Language, Host, MessageType, TalkHistory, ViewMode } from './types';
import { UpcomingVisits } from './components/UpcomingVisits';
import { SpeakerList } from './components/SpeakerList';
import { ScheduleVisitModal } from './components/ScheduleVisitModal';
import { CalendarView } from './components/CalendarView';
import { MessagingCenter } from './components/MessagingCenter';
import { SpeakerDetailsModal } from './components/SpeakerDetailsModal';
import { Settings } from './components/Settings';
import { CalendarIcon, ListViewIcon, EnvelopeIcon, CogIcon, MoonIcon, SunIcon, SearchIcon, DashboardIcon, BookOpenIcon, PodiumIcon, ChartBarIcon, CalendarDaysIcon, PlusIcon, UserIcon, HomeIcon, PrintIcon } from './components/Icons';
import { useToast } from './contexts/ToastContext';
import { useConfirm } from './contexts/ConfirmContext';
import { MessageGeneratorModal } from './components/MessageGeneratorModal';
import { useData } from './contexts/DataContext';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { HostDetailsModal } from './components/HostDetailsModal';
import { Dashboard } from './components/Dashboard';
import { HostList } from './components/HostList';
import { PastVisitsManager } from './components/PastVisitsManager';
import { TabButton } from './components/TabButton';
import useVisitNotifications from './hooks/useVisitNotifications';
import { Avatar } from './components/Avatar';
import { HostRequestModal } from './components/HostRequestModal';
import { TalksManager } from './components/TalksManager';
import { TimelineView } from './components/TimelineView';
import { FeedbackModal } from './components/FeedbackModal';
import { WeekView } from './components/WeekView';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FAB } from './components/FAB';
import { Statistics } from './components/Statistics';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { DashboardPrintLayout } from './components/DashboardPrintLayout';

type Tab = 'dashboard' | 'planning' | 'messaging' | 'talks' | 'statistics' | 'settings';

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
    
    // Modals State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
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
    const [language, setLanguage] = useState<Language>('fr');
    
    // FIX: Capacitor's PermissionState can include 'prompt-with-rationale'. Widening the type to handle all possible states returned by the permissions API.
    const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
    const [showNotificationBanner, setShowNotificationBanner] = useState(false);

    useVisitNotifications(upcomingVisits, notificationPermission);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const stored = localStorage.getItem('is-dark-mode');
        if (stored !== null) {
            return stored === 'true';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    const { addToast } = useToast();
    const confirm = useConfirm();
    const speakerListRef = useRef<HTMLDivElement>(null);
    const hostListRef = useRef<HTMLDivElement>(null);
    const archiveSectionRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const root = window.document.documentElement;

        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Stocker la préférence de l'utilisateur
        localStorage.setItem('is-dark-mode', String(isDarkMode));
    }, [isDarkMode]);
    
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                // On non-native platforms, this might throw.
                if (typeof LocalNotifications === 'undefined') return;

                const result = await LocalNotifications.checkPermissions();
                setNotificationPermission(result.display);

                const notificationPromptDismissed = localStorage.getItem('notificationPromptDismissed');
                if (result.display === 'prompt' && !notificationPromptDismissed) {
                    const timer = setTimeout(() => {
                        setShowNotificationBanner(true);
                    }, 3000);
                    return () => clearTimeout(timer);
                }
            } catch (e) {
                console.warn("Could not check local notification permissions.", e);
            }
        };

        checkPermissions();
    }, []);

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
        // FIX: The original object construction was causing a type inference issue where
        // the 'role' property was being widened to 'string' instead of 'MessageRole'.
        // This new structure is more explicit and ensures correct type assignment.
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
            setVisitForThankYou(null); // Reset after opening
        }
    }, [visitForThankYou, handleOpenMessageGenerator]);


    const toggleTheme = () => {
       setIsDarkMode(prev => !prev);
    };

    const handleScheduleVisit = useCallback((speaker: Speaker) => {
        setSpeakerToSchedule(speaker);
        setEditingVisit(null);
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
        // Use timeout to ensure the list has rendered before scrolling
        setTimeout(() => {
            speakerListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);
    
    // --- Navigation handlers from Dashboard ---
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
        // Use a timeout to ensure the settings tab has rendered before we try to scroll and expand
        setTimeout(() => {
            const archiveSection = archiveSectionRef.current;
            if (archiveSection) {
                archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Programmatically expand the section if it's not already open
                const expandButton = archiveSection.querySelector('[role="button"]') as HTMLElement;
                if (expandButton && expandButton.getAttribute('aria-expanded') === 'false') {
                    expandButton.click();
                }
            }
        }, 150); // A small delay is safer
    }, []);

    // Effect to handle PWA shortcut actions
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        // Use a timeout to ensure modals don't conflict with initial render
        if (action) {
            setTimeout(() => {
                if (action === 'schedule') {
                    handleScheduleFromShortcut();
                } else if (action === 'add_speaker') {
                    handleAddSpeaker();
                } else if (action === 'add_host') {
                    handleAddHost();
                }
                // Clean up URL to avoid re-triggering on reload
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
                    archiveSectionRef={archiveSectionRef}
                />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 bg-background dark:bg-background-dark`}>
                {showNotificationBanner && (
                    <NotificationPermissionBanner
                        onEnable={handleEnableNotifications}
                        onDismiss={handleDismissNotificationBanner}
                    />
                )}
                 <div className="header-safe-area backdrop-blur-lg flex-shrink-0 z-40 no-print">
                    <header className="bg-background/95 dark:bg-background-dark/95 border-b border-white/20 dark:border-white/10">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <div className="flex justify-between items-center py-2 sm:py-4">
                                <div className="flex items-center space-x-3">
                                    <img src={logoUrl} alt="Logo KBV DV LYON" className="w-8 h-8 sm:w-10 sm:h-10" />
                                    <div>
                                        <h1 className="text-lg sm:text-xl font-bold font-display text-primary dark:text-white">{congregationProfile.name}</h1>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setIsSearchModalOpen(true)} className="p-3 rounded-full text-text-main dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-primary-light transition-colors">
                                        <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                     {activeTab === 'dashboard' && (
                                        <button onClick={() => setIsPrintModalOpen(true)} className="p-3 rounded-full text-text-main dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-primary-light transition-colors" title="Imprimer le rapport du tableau de bord">
                                            <PrintIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                    )}
                                    <button onClick={toggleTheme} className="p-3 rounded-full text-text-main dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-primary-light transition-colors">
                                        {isDarkMode ? <SunIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>
                    <nav className="hidden md:flex bg-card-light/95 dark:bg-card-dark/95 border-b border-border-light dark:border-border-dark shadow-sm justify-around">
                        <TabButton icon={DashboardIcon} label="Tableau de bord" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                        <TabButton icon={CalendarIcon} label="Planning" isActive={activeTab === 'planning'} onClick={() => setActiveTab('planning')} />
                        <TabButton icon={EnvelopeIcon} label="Messagerie" isActive={activeTab === 'messaging'} onClick={() => setActiveTab('messaging')} />
                        <TabButton icon={BookOpenIcon} label="Discours" isActive={activeTab === 'talks'} onClick={() => setActiveTab('talks')} />
                        <TabButton icon={ChartBarIcon} label="Statistiques" isActive={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')} />
                        <TabButton icon={CogIcon} label="Paramètres" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    </nav>
                    <nav className="md:hidden bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-lg flex items-center border-b border-border-light dark:border-border-dark shadow-sm no-print overflow-x-auto hide-scrollbar">
                        <TabButton icon={DashboardIcon} label="Accueil" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                        <TabButton icon={CalendarIcon} label="Planning" isActive={activeTab === 'planning'} onClick={() => setActiveTab('planning')} />
                        <TabButton icon={EnvelopeIcon} label="Messages" isActive={activeTab === 'messaging'} onClick={() => setActiveTab('messaging')} />
                        <TabButton icon={BookOpenIcon} label="Discours" isActive={activeTab === 'talks'} onClick={() => setActiveTab('talks')} />
                        <TabButton icon={ChartBarIcon} label="Stats" isActive={activeTab === 'statistics'} onClick={() => setActiveTab('statistics')} />
                        <TabButton icon={CogIcon} label="Paramètres" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    </nav>
                </div>

                <main className="flex-grow min-h-0 mobile-nav-safe-area">
                    {activeTab === 'messaging' ? (
                        renderContent()
                    ) : (
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
                    )}
                </main>
            </div>

            {(activeTab === 'dashboard' || activeTab === 'planning') && (
                <FAB actions={fabActions} />
            )}
            
            {/* Modals are rendered here, outside of the main layout div to ensure they are on top of everything */}
            {isScheduleModalOpen && (
                <ScheduleVisitModal 
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    visit={editingVisit}
                    speaker={speakerToSchedule}
                    onComplete={handleCompleteVisit}
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
                    language={language}
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
                    language={language}
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
