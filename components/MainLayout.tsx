import React from 'react';
import { Tab } from '../types';
import { CongregationProfile } from '../types';
import { 
    CalendarIcon, EnvelopeIcon, CogIcon, MoonIcon, SunIcon, 
    SearchIcon, DashboardIcon, BookOpenIcon, ChartBarIcon, PrintIcon 
} from './Icons';
import { TabButton } from './TabButton';
import { NotificationPermissionBanner } from './NotificationPermissionBanner';

interface MainLayoutProps {
    children: React.ReactNode;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    congregationProfile: CongregationProfile;
    logoUrl: string;
    showNotificationBanner: boolean;
    onEnableNotifications: () => void;
    onDismissNotificationBanner: () => void;
    onOpenSearch: () => void;
    onOpenPrint: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleTheme,
    congregationProfile,
    logoUrl,
    showNotificationBanner,
    onEnableNotifications,
    onDismissNotificationBanner,
    onOpenSearch,
    onOpenPrint
}) => {
    return (
        <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 bg-background dark:bg-background-dark`}>
            {showNotificationBanner && (
                <NotificationPermissionBanner
                    onEnable={onEnableNotifications}
                    onDismiss={onDismissNotificationBanner}
                />
            )}
            <div className="header-safe-area backdrop-blur-lg flex-shrink-0 z-40 no-print" style={{ paddingTop: '24px' }}>
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
                                <button onClick={onOpenSearch} className="p-3 rounded-full text-text-main dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-primary-light transition-colors">
                                    <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                {activeTab === 'dashboard' && (
                                    <button onClick={onOpenPrint} className="p-3 rounded-full text-text-main dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-primary-light transition-colors" title="Imprimer le rapport du tableau de bord">
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

            <main className="flex-grow min-h-0 mobile-nav-safe-area" style={{ paddingBottom: '60px' }}>
                {children}
            </main>
        </div>
    );
};
