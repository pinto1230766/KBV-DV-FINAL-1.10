import React, { useState, useMemo, FC, useRef } from 'react';
import { Visit } from '../types';
import { useData } from '../contexts/DataContext';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, DocumentTextIcon, HomeIcon } from './Icons';
import { Avatar } from './Avatar';

interface TimelineViewProps {
    onEditVisit: (visit: Visit) => void;
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const NUM_MONTHS_TO_SHOW = 4;

// Helper functions
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};
const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);
const daysBetween = (date1: Date, date2: Date): number => {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

const statusColors: { [key in Visit['status']]: { bg: string; text: string } } = {
  pending: { bg: 'bg-amber-400', text: 'text-amber-900' },
  confirmed: { bg: 'bg-green-500', text: 'text-white' },
  cancelled: { bg: 'bg-gray-400', text: 'text-gray-800' },
  completed: { bg: 'bg-blue-500', text: 'text-white' },
};

const Tooltip: FC<{ visit: Visit; position: { top: number, left: number } }> = ({ visit, position }) => (
    <div
        className="absolute z-30 p-3 bg-card-dark text-white rounded-lg shadow-xl text-sm w-64 animate-fade-in"
        style={{ top: position.top, left: position.left, transform: 'translateY(-100%)' }}
    >
        <p className="font-bold">{visit.nom}</p>
        <p className="text-xs text-text-muted-dark">{visit.congregation}</p>
        <div className="border-t border-border-dark my-2"></div>
        <p><strong>Discours:</strong> {new Date(visit.visitDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        {visit.arrivalDate && visit.departureDate && (
             <p><strong>Séjour:</strong> {new Date(visit.arrivalDate + 'T00:00:00').toLocaleDateString('fr-FR')} - {new Date(visit.departureDate + 'T00:00:00').toLocaleDateString('fr-FR')}</p>
        )}
        <p><strong>Accueil:</strong> {visit.host}</p>
        {visit.talkTheme && <p className="mt-1 italic">« {visit.talkTheme} »</p>}
    </div>
);


export const TimelineView: FC<TimelineViewProps> = ({ onEditVisit }) => {
    const { upcomingVisits } = useData();
    const [viewStartDate, setViewStartDate] = useState(startOfMonth(new Date()));
    const [hoveredVisit, setHoveredVisit] = useState<{ visit: Visit; event: React.MouseEvent } | null>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    const timelineData = useMemo(() => {
        const endDate = addMonths(viewStartDate, NUM_MONTHS_TO_SHOW);
        const relevantVisits = upcomingVisits.filter(v => {
            const visitDate = new Date(v.visitDate + 'T00:00:00');
            return visitDate >= viewStartDate && visitDate < endDate && v.status !== 'cancelled';
        });

        const speakersMap = new Map<string, Visit[]>();
        relevantVisits.forEach(visit => {
            if (!speakersMap.has(visit.id)) {
                speakersMap.set(visit.id, []);
            }
            speakersMap.get(visit.id)!.push(visit);
        });

        const months: { name: string; year: number; days: number; }[] = [];
        let totalDays = 0;
        for (let i = 0; i < NUM_MONTHS_TO_SHOW; i++) {
            const date = addMonths(viewStartDate, i);
            const year = date.getFullYear();
            const month = date.getMonth();
            const days = getDaysInMonth(year, month);
            months.push({ name: MONTHS[month], year, days });
            totalDays += days;
        }

        return { speakers: Array.from(speakersMap.entries()), months, totalDays, endDate };
    }, [viewStartDate, upcomingVisits]);
    
    const handlePrev = () => setViewStartDate(prev => addMonths(prev, -3));
    const handleNext = () => setViewStartDate(prev => addMonths(prev, 3));
    
    const tooltipPosition = useMemo(() => {
        if (!hoveredVisit || !timelineContainerRef.current) return { top: 0, left: 0 };
        const rect = timelineContainerRef.current.getBoundingClientRect();
        return {
            top: hoveredVisit.event.clientY - rect.top,
            left: hoveredVisit.event.clientX - rect.left,
        };
    }, [hoveredVisit]);


    return (
        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-soft-lg">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary-light/20"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary-light/20"><ChevronRightIcon className="w-6 h-6" /></button>
                </div>
                <h3 className="font-bold text-lg">{viewStartDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} - {addMonths(timelineData.endDate, -1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div className="relative" ref={timelineContainerRef}>
                {hoveredVisit && <Tooltip visit={hoveredVisit.visit} position={tooltipPosition} />}
                <div className="flex">
                    <div className="w-48 flex-shrink-0 border-r border-border-light dark:border-border-dark">
                        <div className="h-16 border-b border-border-light dark:border-border-dark flex items-center p-2"><span className="font-bold">Orateur</span></div>
                        {timelineData.speakers.map(([speakerId, visits]) => (
                            <div key={speakerId} className="h-12 flex items-center p-2 border-b border-border-light dark:border-border-dark">
                                 <Avatar item={visits[0]} size="w-8 h-8 mr-2" />
                                 <span className="text-sm font-semibold truncate" title={visits[0].nom}>{visits[0].nom}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex-grow overflow-x-auto">
                        <div style={{ width: `${timelineData.totalDays * 3}rem` }}>
                            {/* Header */}
                            <div className="flex h-16 border-b border-border-light dark:border-border-dark relative">
                                {timelineData.months.map(month => (
                                    <div key={`${month.name}-${month.year}`} className="border-r border-border-light dark:border-border-dark" style={{ width: `${month.days * 3}rem`}}>
                                        <div className="font-bold text-center p-1">{month.name} {month.year}</div>
                                        <div className="flex">
                                            {[...Array(month.days)].map((_, day) => (
                                                <div key={day} className="w-12 text-center text-xs text-text-muted dark:text-text-muted-dark">{day + 1}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Rows */}
                            {timelineData.speakers.map(([speakerId, visits]) => (
                                <div key={speakerId} className="h-12 border-b border-border-light dark:border-border-dark relative">
                                    {visits.map(visit => {
                                        const startDate = visit.arrivalDate ? new Date(visit.arrivalDate + "T00:00:00") : new Date(visit.visitDate + "T00:00:00");
                                        const endDate = visit.departureDate ? new Date(visit.departureDate + "T00:00:00") : new Date(visit.visitDate + "T00:00:00");
                                        
                                        const offset = Math.max(0, daysBetween(viewStartDate, startDate));
                                        const duration = Math.max(1, daysBetween(startDate, endDate) + 1);

                                        const color = statusColors[visit.status] || statusColors.pending;

                                        return (
                                            <div
                                                key={visit.visitId}
                                                onClick={() => onEditVisit(visit)}
                                                onMouseEnter={(e) => setHoveredVisit({ visit, event: e })}
                                                onMouseLeave={() => setHoveredVisit(null)}
                                                className={`absolute top-1.5 h-9 rounded-md cursor-pointer flex items-center px-2 ${color.bg} ${color.text}`}
                                                style={{ left: `${offset * 3}rem`, width: `${duration * 3}rem` }}
                                            >
                                                <p className="text-xs font-bold truncate">{visit.talkTheme || visit.nom}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
             {timelineData.speakers.length === 0 && (
                <div className="text-center py-12 text-text-muted dark:text-text-muted-dark">
                    <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 font-semibold">Aucune visite programmée pour cette période.</p>
                </div>
            )}
        </div>
    );
}