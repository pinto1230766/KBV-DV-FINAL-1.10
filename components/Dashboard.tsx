// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { Visit, MessageRole, MessageType, Speaker, Host } from '../types';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
    PlusIcon, 
    UserIcon, 
    HomeIcon, 
    CalendarDaysIcon, 
    CheckCircleIcon, 
    ArrowRightIcon,
    CalendarIcon
} from './Icons';
import { ProactiveAssistant } from './PlanningAssistant';
import { DashboardDonutChart } from './DashboardDonutChart';

// Gestion de la navigation côté client
const useRouterShim = () => ({
    push: (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    }
});

interface DashboardProps {
    onScheduleVisitClick: () => void;
    onAddSpeakerClick: () => void;
    onAddHostClick: () => void;
    onEditVisitClick: (visit: Visit) => void;
    onOpenMessageGenerator: (visit: Visit, role: MessageRole, messageType?: MessageType) => void;
    onOpenHostRequestModal: (visits: Visit[]) => void;
    setActiveTab: (tab: 'planning' | 'messaging' | 'talks' | 'settings') => void;
    onGoToSpeakers: () => void;
    onGoToHosts: () => void;
    onGoToPlanning: () => void;
    onGoToSettings: () => void;
    onLeaveFeedback: (visit: Visit) => void;
}

interface QuickStatCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    onClick: () => void;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-soft-lg flex items-center space-x-4 transition-transform transform active:scale-95 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    >
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-3xl font-bold text-text-main dark:text-text-main-dark">{value}</p>
            <h3 className="text-sm font-medium text-text-muted dark:text-text-muted-dark">{title}</h3>
        </div>
    </div>
);

const ShortcutButton: React.FC<{ label: string; onClick: () => void; icon: React.FC<any>; }> = ({ label, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        className="flex items-center p-4 bg-card-light dark:bg-card-dark/90 rounded-xl shadow-soft-lg w-full text-left transition-colors transform active:scale-95 hover:bg-gray-100 dark:hover:bg-primary-dark/70"
    >
        <div className="p-3 bg-secondary/10 dark:bg-secondary/30 rounded-lg">
            <Icon className="w-6 h-6 text-secondary dark:text-secondary-light" />
        </div>
        <span className="ml-4 font-semibold text-text-main dark:text-text-main-dark flex-grow">{label}</span>
        <ArrowRightIcon className="w-5 h-5 ml-auto text-text-muted dark:text-text-muted-dark" />
    </button>
);


export const Dashboard: React.FC<DashboardProps> = ({ 
    onScheduleVisitClick, 
    onAddSpeakerClick, 
    onAddHostClick, 
    onEditVisitClick, 
    onOpenMessageGenerator,
    onOpenHostRequestModal,
    setActiveTab,
    onGoToSpeakers,
    onGoToHosts,
    onGoToPlanning,
    onGoToSettings,
    onLeaveFeedback
}) => {
    const router = useRouterShim();
    const data = useData() || {};
    const speakers = Array.isArray(data.speakers) ? data.speakers : [];
    const hosts = Array.isArray(data.hosts) ? data.hosts : [];
    const upcomingVisits = Array.isArray(data.upcomingVisits) ? data.upcomingVisits : [];
    const archivedVisits = Array.isArray(data.archivedVisits) ? data.archivedVisits : [];
    
    const { settings } = useSettings();
    const { dashboardSettings } = settings;

    // Auto-refresh logic
    useEffect(() => {
        if (dashboardSettings.autoRefresh && dashboardSettings.refreshInterval > 0) {
            const intervalId = setInterval(() => {
                console.log(`Dashboard auto-refresh triggered at ${new Date().toLocaleTimeString()}`);
                // In a real scenario, this would trigger a data refetch.
                // For now, it's just a log to show functionality.
            }, dashboardSettings.refreshInterval * 1000); // Convert seconds to milliseconds

            return () => clearInterval(intervalId);
        }
    }, [dashboardSettings.autoRefresh, dashboardSettings.refreshInterval]);


    const stats = [
        { title: "Orateurs", value: speakers?.length || 0, icon: UserIcon, color: "bg-accent", onClick: onGoToSpeakers },
        { title: "Contacts d'accueil", value: hosts?.length || 0, icon: HomeIcon, color: "bg-secondary", onClick: onGoToHosts },
        { title: "Visites à venir", value: upcomingVisits?.length || 0, icon: CalendarDaysIcon, color: "bg-highlight", onClick: onGoToPlanning },
        { title: "Visites archivées", value: archivedVisits?.length || 0, icon: CheckCircleIcon, color: "bg-primary", onClick: onGoToSettings },
    ];

    const visitTypeData = useMemo(() => {
        const counts = { physical: 0, zoom: 0, streaming: 0 };
        
        // Utilisation d'une boucle for classique pour éviter les problèmes de typage
        const visits = Array.isArray(upcomingVisits) ? upcomingVisits : [];
        for (let i = 0; i < visits.length; i++) {
            const visit = visits[i];
            if (visit && visit.locationType) {
                counts[visit.locationType] = (counts[visit.locationType] || 0) + 1;
            }
        }
        
        // Création du tableau de résultat
        const result = [
            { label: 'Présentiel', value: counts.physical || 0, color: 'text-primary' },
            { label: 'Zoom', value: counts.zoom || 0, color: 'text-accent' },
            { label: 'Streaming', value: counts.streaming || 0, color: 'text-highlight' },
        ];
        
        // Filtrage manuel pour éviter les problèmes avec .filter()
        const filteredResult = [];
        for (let i = 0; i < result.length; i++) {
            if (result[i].value > 0) {
                filteredResult.push(result[i]);
            }
        }
        
        return filteredResult;
    }, [upcomingVisits]);

    const communicationStatusData = useMemo(() => {
        const counts = { 'À planifier': 0, 'En cours': 0, 'Prêt': 0 };
        
        // Utilisation d'une boucle for classique pour éviter les problèmes de typage
        const visits = Array.isArray(upcomingVisits) ? upcomingVisits : [];
        for (let i = 0; i < visits.length; i++) {
            const visit = visits[i];
            if (!visit) continue;
            
            const comms = visit.communicationStatus || {};
            const confirmationSent = !!(comms.confirmation && comms.confirmation.speaker);
            const prepSpeakerSent = !!(comms.preparation && comms.preparation.speaker);
            const prepHostSent = visit.locationType !== 'physical' || !!(comms.preparation && comms.preparation.host);

            if (confirmationSent && prepSpeakerSent && prepHostSent) {
                counts['Prêt'] = (counts['Prêt'] || 0) + 1;
            } else if (confirmationSent) {
                counts['En cours'] = (counts['En cours'] || 0) + 1;
            } else {
                counts['À planifier'] = (counts['À planifier'] || 0) + 1;
            }
        }
        
        // Création du tableau de résultat
        const result = [
            { label: 'Prêt', value: counts['Prêt'] || 0, color: 'text-green-500' },
            { label: 'En cours', value: counts['En cours'] || 0, color: 'text-amber-500' },
            { label: 'À planifier', value: counts['À planifier'] || 0, color: 'text-red-500' },
        ];
        
        // Filtrage manuel pour éviter les problèmes avec .filter()
        const filteredResult = [];
        for (let i = 0; i < result.length; i++) {
            if (result[i].value > 0) {
                filteredResult.push(result[i]);
            }
        }
        
        return filteredResult;
    }, [upcomingVisits]);


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {Array.isArray(stats) && stats.map((stat, index) => (
                    <QuickStatCard 
                        key={index} 
                        title={stat.title} 
                        value={stat.value} 
                        icon={stat.icon} 
                        color={stat.color} 
                        onClick={stat.onClick} 
                    />
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms' }}>
                    <ProactiveAssistant
                        onOpenHostRequestModal={onOpenHostRequestModal}
                        onEditVisitClick={onEditVisitClick}
                        onLeaveFeedback={onLeaveFeedback}
                        onScheduleVisitClick={onScheduleVisitClick}
                        setActiveTab={setActiveTab}
                    />
                </div>
                 <div className="space-y-8 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark mb-4">Raccourcis</h2>
                        <div className="space-y-4">
                            <ShortcutButton label="Programmer une visite" onClick={onScheduleVisitClick} icon={PlusIcon} />
                            <ShortcutButton label="Ajouter un orateur" onClick={onAddSpeakerClick} icon={UserIcon} />
                            <ShortcutButton label="Ajouter un contact d'accueil" onClick={onAddHostClick} icon={HomeIcon} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {upcomingVisits.length > 0 ? (
                            <>
                                <DashboardDonutChart title="Répartition par type" data={visitTypeData} />
                                <DashboardDonutChart title="Statut de communication" data={communicationStatusData} />
                            </>
                        ) : (
                            <div className="text-center py-12 px-6 bg-card-light dark:bg-card-dark rounded-lg shadow-soft-lg sm:col-span-2">
                                <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                                <h2 className="mt-4 text-2xl font-semibold text-text-main dark:text-text-main-dark">Aucune visite programmée</h2>
                                <p className="mt-2 text-text-muted dark:text-text-muted-dark">Commencez par planifier une visite depuis la liste des orateurs.</p>
                                <button
                                    onClick={onScheduleVisitClick}
                                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform active:scale-95"
                                >
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                    Programmer une visite
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};