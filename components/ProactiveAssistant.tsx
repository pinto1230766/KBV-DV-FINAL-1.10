import React, { useMemo, useState, useEffect } from 'react';
import { Visit } from '../types';
import { useData } from '../contexts/DataContext';
import { UNASSIGNED_HOST } from '../constants';
import { ArrowRightIcon, ExclamationTriangleIcon, StarIcon, PlusIcon, SunIcon, CarIcon, SpinnerIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from './Avatar';

interface ProactiveAssistantProps {
  onOpenHostRequestModal: (visits: Visit[]) => void;
  onEditVisitClick: (visit: Visit) => void;
  onLeaveFeedback: (visit: Visit) => void;
  onScheduleVisitClick: () => void;
}

const daysSince = (dateStr: string) => {
    const visitDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - visitDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const daysUntil = (dateStr: string) => {
    const visitDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = visitDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getUrgencyInfoForFuture = (visit: Visit) => {
    const days = daysUntil(visit.visitDate);
    if (days < 0) return { level: 'past', text: `Passé`, color: 'bg-gray-500/20 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300' };
    if (days <= 7) return { level: 'critical', text: `Dans ${days} j.`, color: 'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300' };
    if (days <= 14) return { level: 'warning', text: `Dans ${days} j.`, color: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300' };
    return { level: 'normal', text: `Dans ${days} j.`, color: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' };
};

const getUrgencyInfoForPast = (visit: Visit) => {
    const days = daysSince(visit.visitDate);
    if (days > 14) return { level: 'critical', text: `Il y a ${days} j.`, color: 'bg-red-500/20 text-red-700 dark:bg-red-500/30 dark:text-red-300' };
    if (days > 7) return { level: 'warning', text: `Il y a ${days} j.`, color: 'bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300' };
    return { level: 'normal', text: `Il y a ${days} j.`, color: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' };
};

export const ProactiveAssistant: React.FC<ProactiveAssistantProps> = (props) => {
    const { upcomingVisits, archivedVisits, speakers, apiKey, congregationProfile, hosts, isOnline } = useData();
    const { addToast } = useToast();
    const [weather, setWeather] = useState<string | null>(null);
    const [travelTime, setTravelTime] = useState<string | null>(null);
    const [isFetchingWeather, setIsFetchingWeather] = useState(false);
    const [isFetchingTravel, setIsFetchingTravel] = useState(false);

    const nextVisit = useMemo(() => upcomingVisits[0], [upcomingVisits]);

    useEffect(() => {
        // Reset dynamic data when the next visit changes
        setWeather(null);
        setTravelTime(null);
    }, [nextVisit]);
    
    const fetchWeather = async () => {
        if (!nextVisit || !apiKey || !isOnline) return;
        setIsFetchingWeather(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const location = (congregationProfile.latitude && congregationProfile.longitude)
                ? `les coordonnées lat:${congregationProfile.latitude}, lon:${congregationProfile.longitude}`
                : 'Lyon, France';
            const date = new Date(nextVisit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
            const prompt = `Quelle est la météo prévue pour ${location} le ${date}? Donne une réponse très courte et concise, par exemple : "Ensoleillé, 24°C / 18°C".`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setWeather(response.text);
        } catch (error) {
            addToast("Impossible de récupérer la météo.", 'error');
        } finally {
            setIsFetchingWeather(false);
        }
    };

    const fetchTravelTime = async () => {
        if (!nextVisit || !apiKey || !isOnline) return;
        const host = hosts.find(h => h.nom === nextVisit.host);
        if (!host?.address) {
            addToast("L'adresse du contact d'accueil est manquante.", "warning");
            return;
        }

        setIsFetchingTravel(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const destination = (congregationProfile.latitude && congregationProfile.longitude)
                ? `les coordonnées lat:${congregationProfile.latitude}, lon:${congregationProfile.longitude}`
                : "Salle du Royaume des Témoins de Jéhovah, 16 Rue Imbert Colomes, 69001 Lyon";
            const prompt = `Quel est le temps de trajet en voiture entre "${host.address}" et ${destination} un samedi après-midi? Donne une estimation concise, par exemple : "Environ 25 min en voiture".`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setTravelTime(response.text);
        } catch(error) {
            addToast("Impossible de calculer le temps de trajet.", 'error');
        } finally {
            setIsFetchingTravel(false);
        }
    };

    const visitsNeedingHost = useMemo(() =>
        upcomingVisits.filter(v =>
            v.host === UNASSIGNED_HOST &&
            v.status !== 'cancelled' &&
            v.locationType === 'physical' &&
            !v.congregation.toLowerCase().includes('lyon')
        ).sort((a,b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()),
        [upcomingVisits]
    );
    
    const visitsNeedingFeedback = useMemo(() => 
        archivedVisits.filter(v => !v.feedback && daysSince(v.visitDate) <= 30)
        .sort((a,b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()),
        [archivedVisits]
    );

    const hasActions = visitsNeedingHost.length > 0 || visitsNeedingFeedback.length > 0;

    return (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-secondary dark:text-white mb-4">Assistant Proactif</h2>
            <div className="space-y-4">
                {nextVisit && (
                    <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border-l-4 border-primary">
                        <h3 className="font-bold text-primary dark:text-primary-light mb-2">Prochain Événement</h3>
                        <div className="flex items-center gap-4 mb-4">
                             <Avatar item={nextVisit} size="w-12 h-12" />
                             <div>
                                <p className="font-bold text-lg text-text-main dark:text-text-main-dark">{nextVisit.nom}</p>
                                <p className="font-semibold text-text-muted dark:text-text-muted-dark">{new Date(nextVisit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-primary-light/10 rounded-md">
                                {isFetchingWeather ? <SpinnerIcon className="w-5 h-5 text-primary"/> : weather ? <p className="font-semibold">{weather}</p> : <button onClick={fetchWeather} disabled={!apiKey || !isOnline} className="flex items-center gap-2 font-semibold text-primary dark:text-primary-light disabled:opacity-50"><SunIcon className="w-5 h-5"/> Voir la météo</button>}
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-primary-light/10 rounded-md">
                                {nextVisit.locationType !== 'physical' || !hosts.find(h => h.nom === nextVisit.host)?.address ? <p className="text-text-muted dark:text-text-muted-dark text-xs">Trajet non applicable</p> : isFetchingTravel ? <SpinnerIcon className="w-5 h-5 text-primary"/> : travelTime ? <p className="font-semibold">{travelTime}</p> : <button onClick={fetchTravelTime} disabled={!apiKey || !isOnline} className="flex items-center gap-2 font-semibold text-primary dark:text-primary-light disabled:opacity-50"><CarIcon className="w-5 h-5"/> Calculer le trajet</button>}
                            </div>
                        </div>
                    </div>
                )}
                
                {!hasActions && !nextVisit && (
                    <div className="text-center p-4">
                        <p className="text-green-600 dark:text-green-400 font-semibold">Tout est à jour !</p>
                         <p className="text-text-muted dark:text-text-muted-dark mt-1">Aucune action urgente n'est requise pour le moment.</p>
                    </div>
                )}

                {visitsNeedingHost.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-6 h-6"/>
                                {visitsNeedingHost.length} visite{visitsNeedingHost.length > 1 ? 's' : ''} sans accueil
                            </h3>
                            {visitsNeedingHost.length > 1 && (
                                <button onClick={() => props.onOpenHostRequestModal(visitsNeedingHost)} className="text-sm font-semibold text-primary dark:text-primary-light hover:underline">
                                    Demande groupée
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {visitsNeedingHost.slice(0,2).map(visit => {
                                const urgency = getUrgencyInfoForFuture(visit);
                                return (
                                    <div key={visit.visitId} onClick={() => props.onEditVisitClick(visit)} className="flex items-center justify-between p-3 bg-card-light dark:bg-card-dark rounded-md cursor-pointer hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-semibold">{visit.nom}</p>
                                            <p className="text-xs text-text-muted dark:text-text-muted-dark">{new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${urgency.color}`}>{urgency.text}</span>
                                            <ArrowRightIcon className="w-5 h-5 text-text-muted dark:text-text-muted-dark"/>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                 {visitsNeedingFeedback.length > 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                            <StarIcon className="w-6 h-6"/>
                            {visitsNeedingFeedback.length} avis en attente
                        </h3>
                        <div className="space-y-2">
                            {visitsNeedingFeedback.slice(0, 1).map(visit => {
                                const urgency = getUrgencyInfoForPast(visit);
                                return(
                                    <div key={visit.visitId} onClick={() => props.onLeaveFeedback(visit)} className="flex items-center justify-between p-3 bg-card-light dark:bg-card-dark rounded-md cursor-pointer hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-semibold">{visit.nom}</p>
                                            <p className="text-xs text-text-muted dark:text-text-muted-dark">{new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${urgency.color}`}>{urgency.text}</span>
                                            <ArrowRightIcon className="w-5 h-5 text-text-muted dark:text-text-muted-dark"/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};