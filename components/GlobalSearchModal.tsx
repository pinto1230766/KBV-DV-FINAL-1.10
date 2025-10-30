import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Visit, Speaker, Host } from '../types';
import { SearchIcon, XIcon, CalendarIcon, BookOpenIcon } from './Icons';
import { useData } from '../contexts/DataContext';
import { Avatar } from './Avatar';
import { searchEngine, SearchResult } from '../utils/search';
import { performanceMonitor } from '../utils/performance';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditVisit: (visit: Visit) => void;
    onEditSpeaker: (speaker: Speaker) => void;
    onEditHost: (host: Host) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
    isOpen,
    onClose,
    onEditVisit,
    onEditSpeaker,
    onEditHost,
}) => {
    const { speakers, visits, hosts, publicTalks } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setStartDate('');
            setEndDate('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Recherche avec le moteur de recherche avancé
    useEffect(() => {
        const performSearch = () => {
            if (!searchTerm.trim() && !startDate && !endDate) {
                setSearchResults([]);
                return;
            }

            const results = performanceMonitor.measureSync('search_operation', () => {
                let filteredVisits = visits;
                
                // Filtrage par date si spécifié
                if (startDate || endDate) {
                    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
                    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

                    filteredVisits = visits.filter(v => {
                        const visitDate = new Date(`${v.visitDate}T00:00:00`);
                        if (start && visitDate < start) return false;
                        if (end && visitDate > end) return false;
                        return true;
                    });
                }

                return searchEngine.search(searchTerm, {
                    speakers,
                    visits: filteredVisits,
                    hosts,
                    talks: publicTalks
                }, { limit: 20 });
            });

            setSearchResults(results);
        };

        const debounceTimer = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, startDate, endDate, speakers, visits, hosts, publicTalks]);
    
    const hasResults = searchResults.length > 0;
    const hasActiveFilter = searchTerm.trim() || startDate || endDate;

    const groupedResults = useMemo(() => {
        const groups = {
            speakers: [] as SearchResult[],
            visits: [] as SearchResult[],
            hosts: [] as SearchResult[],
            talks: [] as SearchResult[]
        };

        searchResults.forEach(result => {
            groups[result.type].push(result);
        });

        return groups;
    }, [searchResults]);

    const handleResultClick = (result: SearchResult) => {
        switch (result.type) {
            case 'speaker':
                onEditSpeaker(result.item as Speaker);
                break;
            case 'visit':
                onEditVisit(result.item as Visit);
                break;
            case 'host':
                onEditHost(result.item as Host);
                break;
            case 'talk':
                // Optionnel: ouvrir la gestion des discours
                break;
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center pt-[10vh] p-4 sm:p-6 md:p-8" onClick={onClose}>
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-2xl w-full sm:max-w-3xl flex flex-col max-h-[80vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-primary to-secondary dark:from-primary-dark dark:to-secondary rounded-t-xl">
                    <div className="p-4 flex items-center">
                        <SearchIcon className="w-6 h-6 text-white/70 mr-3 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Rechercher un orateur, une visite, un frère..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-lg bg-transparent focus:outline-none text-white placeholder:text-white/60"
                        />
                         <button onClick={onClose} className="p-2 rounded-full text-white/70 hover:bg-white/20 ml-3">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="px-4 pb-3 border-t border-white/20">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="w-full sm:flex-1">
                                <label htmlFor="start-date" className="text-xs font-semibold text-white/80">Entre le</label>
                                <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-1.5 rounded-md bg-white/20 text-white border-0 focus:ring-2 focus:ring-white/50 text-sm" />
                            </div>
                            <div className="w-full sm:flex-1">
                                <label htmlFor="end-date" className="text-xs font-semibold text-white/80">et le</label>
                                <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-1.5 rounded-md bg-white/20 text-white border-0 focus:ring-2 focus:ring-white/50 text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="overflow-y-auto p-4">
                    {!hasActiveFilter && (
                        <div className="text-center py-12">
                            <p className="text-lg text-text-muted dark:text-text-muted-dark">Commencez votre recherche ci-dessus.</p>
                        </div>
                    )}
                    {hasActiveFilter && !hasResults && (
                         <div className="text-center py-12">
                            <div className="text-center">
                                <p className="text-lg text-text-muted dark:text-text-muted-dark mb-2">Aucun résultat trouvé</p>
                                <p className="text-sm text-text-muted dark:text-text-muted-dark">Essayez avec d'autres mots-clés ou vérifiez l'orthographe</p>
                            </div>
                        </div>
                    )}
                    
                    {groupedResults.speakers.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-sm uppercase text-text-muted dark:text-text-muted-dark px-2 mb-2">Orateurs</h3>
                            <ul className="space-y-1">
                                {groupedResults.speakers.map(result => {
                                    const speaker = result.item as Speaker;
                                    return (
                                        <li key={speaker.id} onClick={() => handleResultClick(result)} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            <Avatar item={speaker} />
                                            <div className="ml-3 flex-1">
                                                <p className="font-semibold text-text-main dark:text-text-main-dark">{speaker.nom}</p>
                                                <p className="text-sm text-text-muted dark:text-text-muted-dark">{speaker.congregation}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {result.matches.map(match => (
                                                        <span key={match} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                            {match}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-xs text-text-muted dark:text-text-muted-dark">
                                                {Math.round(result.score)}%
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {groupedResults.visits.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-sm uppercase text-text-muted dark:text-text-muted-dark px-2 mb-2">Visites programmées</h3>
                            <ul className="space-y-1">
                                {groupedResults.visits.map(result => {
                                    const visit = result.item as Visit;
                                    return (
                                        <li key={visit.visitId} onClick={() => handleResultClick(result)} className="flex items-start p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            <CalendarIcon className="w-10 h-10 text-primary bg-primary/10 p-2 rounded-full flex-shrink-0 mt-1" />
                                            <div className="ml-3 min-w-0 flex-1">
                                                <p className="font-semibold text-text-main dark:text-text-main-dark">{visit.nom}</p>
                                                <p className="text-sm text-text-muted dark:text-text-muted-dark">Le {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR')} - Accueil: {visit.host}</p>
                                                {visit.talkTheme && (
                                                    <p className="text-xs text-text-muted dark:text-text-muted-dark truncate italic mt-1">
                                                        « {visit.talkTheme} »
                                                    </p>
                                                )}
                                                <div className="flex gap-1 mt-1">
                                                    {result.matches.map(match => (
                                                        <span key={match} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                            {match}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-xs text-text-muted dark:text-text-muted-dark">
                                                {Math.round(result.score)}%
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    
                    {groupedResults.hosts.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold text-sm uppercase text-text-muted dark:text-text-muted-dark px-2 mb-2">Frères pour l'accueil</h3>
                            <ul className="space-y-1">
                                {groupedResults.hosts.map(result => {
                                    const host = result.item as Host;
                                    return (
                                        <li key={host.nom} onClick={() => handleResultClick(result)} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            <Avatar item={host} />
                                            <div className="ml-3 flex-1">
                                                <p className="font-semibold text-text-main dark:text-text-main-dark">{host.nom}</p>
                                                <p className="text-sm text-text-muted dark:text-text-muted-dark">{host.telephone || 'N/A'}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {result.matches.map(match => (
                                                        <span key={match} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                            {match}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-xs text-text-muted dark:text-text-muted-dark">
                                                {Math.round(result.score)}%
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {groupedResults.talks.length > 0 && (
                        <div>
                            <h3 className="font-bold text-sm uppercase text-text-muted dark:text-text-muted-dark px-2 mb-2">Discours publics</h3>
                            <ul className="space-y-1">
                                {groupedResults.talks.map(result => {
                                    const talk = result.item as any;
                                    return (
                                        <li key={talk.number} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <BookOpenIcon className="w-10 h-10 text-secondary bg-secondary/10 p-2 rounded-full flex-shrink-0" />
                                            <div className="ml-3 flex-1">
                                                <p className="font-semibold text-text-main dark:text-text-main-dark">N° {talk.number}</p>
                                                <p className="text-sm text-text-muted dark:text-text-muted-dark">{talk.theme}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {result.matches.map(match => (
                                                        <span key={match} className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                                                            {match}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-xs text-text-muted dark:text-text-muted-dark">
                                                {Math.round(result.score)}%
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};