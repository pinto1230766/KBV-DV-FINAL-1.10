import React, { useState, useMemo } from 'react';
import { Visit, MessageRole, MessageType } from '../types';
import { useData } from '../contexts/DataContext';
import { 
    PlusIcon, 
    UserIcon, 
    HomeIcon, 
    CalendarDaysIcon, 
    CheckCircleIcon, 
    ArrowRightIcon
} from './Icons';
import { ProactiveAssistant } from './ProactiveAssistant';
import { DashboardDonutChart } from './DashboardDonutChart';

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

const QuickStatCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: string; onClick?: () => void; }> = ({ title, value, icon: Icon, color, onClick }) => (
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
        className="flex items-center p-4 bg-white dark:bg-primary-light rounded-xl shadow-soft-lg w-full text-left hover:bg-gray-100 dark:hover:bg-primary transition-colors transform active:scale-95"
    >
        <div className="p-3 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
            <Icon className="w-6 h-6 text-secondary dark:text-secondary" />
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
    const { hosts, speakers, archivedVisits, upcomingVisits } = useData();
    
    const stats = [
        { title: "Orateurs", value: speakers.length, icon: UserIcon, color: "bg-accent", onClick: onGoToSpeakers },
        { title: "Contacts d'accueil", value: hosts.length, icon: HomeIcon, color: "bg-secondary", onClick: onGoToHosts },
        { title: "Visites à venir", value: upcomingVisits.length, icon: CalendarDaysIcon, color: "bg-highlight", onClick: onGoToPlanning },
        { title: "Visites archivées", value: archivedVisits.length, icon: CheckCircleIcon, color: "bg-primary", onClick: onGoToSettings },
    ];

    const visitTypeData = useMemo(() => {
        const counts = { physical: 0, zoom: 0, streaming: 0 };
        upcomingVisits.forEach(v => {
            counts[v.locationType] = (counts[v.locationType] || 0) + 1;
        });
        return [
            { label: 'Présentiel', value: counts.physical, color: 'text-primary' },
            { label: 'Zoom', value: counts.zoom, color: 'text-accent' },
            { label: 'Streaming', value: counts.streaming, color: 'text-highlight' },
        ].filter(d => d.value > 0);
    }, [upcomingVisits]);

    const communicationStatusData = useMemo(() => {
        const counts = { 'À planifier': 0, 'En cours': 0, 'Prêt': 0 };
        upcomingVisits.forEach(v => {
            const comms = v.communicationStatus || {};
            const confirmationSent = !!comms.confirmation?.speaker;
            const prepSpeakerSent = !!comms.preparation?.speaker;
            const prepHostSent = v.locationType !== 'physical' || !!comms.preparation?.host;

            if (confirmationSent && prepSpeakerSent && prepHostSent) {
                counts['Prêt']++;
            } else if (confirmationSent) {
                counts['En cours']++;
            } else {
                counts['À planifier']++;
            }
        });
        return [
            { label: 'Prêt', value: counts['Prêt'], color: 'text-green-500' },
            { label: 'En cours', value: counts['En cours'], color: 'text-amber-500' },
            { label: 'À planifier', value: counts['À planifier'], color: 'text-red-500' },
        ].filter(d => d.value > 0);
    }, [upcomingVisits]);


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up animation-delay-100">
                 {stats.map((stat, index) => (
                    <QuickStatCard key={stat.title} {...stat} />
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8 animate-fade-in-up opacity-0 animation-delay-200">
                    <ProactiveAssistant
                        onOpenHostRequestModal={onOpenHostRequestModal}
                        onEditVisitClick={onEditVisitClick}
                        onLeaveFeedback={onLeaveFeedback}
                        onScheduleVisitClick={onScheduleVisitClick}
                    />
                </div>
                 <div className="space-y-8 animate-fade-in-up opacity-0 animation-delay-400">
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
                            <div className="sm:col-span-2 bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-soft-lg text-center">
                                <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark mb-2">Aucune visite à venir</h3>
                                <p className="text-text-muted dark:text-text-muted-dark">Programmez une visite pour voir les statistiques ici.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
