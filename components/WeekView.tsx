import React, { useState, useMemo } from 'react';
import { Visit, SpecialDate, SpecialDateType } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon, VideoCameraIcon, WifiIcon, PodiumIcon, ShieldCheckIcon, UserIcon, InformationCircleIcon } from './Icons';
import { useData } from '../contexts/DataContext';
import { holidays, schoolVacations } from '../data/calendar_data';

interface WeekViewProps {
    onEditVisit: (visit: Visit) => void;
}

// --- Helper Functions ---
const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const toYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Static Data ---
const countryFlags: { [key: string]: string } = { FR: '🇫🇷', PT: '🇵🇹', CV: '🇨🇻' };

const specialDateInfo: Record<SpecialDateType, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
    assembly: { label: "Assemblée", icon: PodiumIcon, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200' },
    co_visit: { label: "Visite surveillant", icon: ShieldCheckIcon, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
    special_talk: { label: "Discours spécial", icon: UserIcon, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' },
    no_meeting: { label: "Pas de réunion", icon: InformationCircleIcon, color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' },
    other: { label: "Autre événement", icon: InformationCircleIcon, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200' }
};

// Status styles for visit cards
const statusStyles: { [key in Visit['status']]: { border: string; bg: string } } = {
  pending: { border: 'border-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  confirmed: { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  cancelled: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  completed: { border: 'border-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/20' },
};

// --- Sub-components ---
const WeekVisitCard: React.FC<{ visit: Visit; onEdit: (v: Visit) => void }> = ({ visit, onEdit }) => {
    const style = statusStyles[visit.status] || statusStyles.pending;
    return (
        <div 
            onClick={() => onEdit(visit)}
            className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${style.border} ${style.bg}`}
        >
            <div className="flex items-center gap-2">
                {visit.locationType === 'physical' && <HomeIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                {visit.locationType === 'zoom' && <VideoCameraIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                {visit.locationType === 'streaming' && <WifiIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />}
                <p className="font-bold text-sm text-text-main dark:text-text-main-dark truncate">{visit.nom}</p>
            </div>
            {visit.talkTheme && (
                <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 truncate" title={visit.talkTheme}>
                    « {visit.talkTheme} »
                </p>
            )}
        </div>
    );
};


// --- Main Component ---
export const WeekView: React.FC<WeekViewProps> = ({ onEditVisit }) => {
    const { upcomingVisits, specialDates } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

    const weekDates = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            dates.push(addDays(startOfWeek, i));
        }
        return dates;
    }, [startOfWeek]);

    const weekDetails = useMemo(() => {
        const year = startOfWeek.getFullYear();
        const nextYear = addDays(startOfWeek, 6).getFullYear();
        const yearHolidays = [...(holidays[year] || []), ...(holidays[nextYear] || [])];

        // Create special dates map for quick lookup
        const specialDateMap = new Map<string, SpecialDate>();
        (specialDates || []).forEach(sd => specialDateMap.set(sd.date, sd));

        return weekDates.map(date => {
            const dateStr = toYYYYMMDD(date);
            const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            const dayVisits = upcomingVisits.filter(v => {
                if (v.status === 'cancelled') return false;
                const visitDateStr = toYYYYMMDD(new Date(v.visitDate + 'T00:00:00'));
                return visitDateStr === dateStr;
            });

            const dayHolidays = yearHolidays.filter(h => h.date === monthDay);

            const dayVacations = schoolVacations.filter(v => {
                const start = new Date(v.start + 'T00:00:00');
                const end = new Date(v.end + 'T00:00:00');
                const currentDate = new Date(dateStr + 'T00:00:00');
                return currentDate >= start && currentDate <= end;
            });

            const daySpecialDate = specialDateMap.get(dateStr);

            return { date, dayVisits, dayHolidays, dayVacations, daySpecialDate };
        });
    }, [weekDates, upcomingVisits, startOfWeek, specialDates]);

    const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
    const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
    const handleToday = () => setCurrentDate(new Date());

    return (
        <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevWeek} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary-light/20">
                        <ChevronLeftIcon className="w-6 h-6 text-text-muted dark:text-text-muted-dark" />
                    </button>
                    <button onClick={handleNextWeek} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-primary-light/20">
                        <ChevronRightIcon className="w-6 h-6 text-text-muted dark:text-text-muted-dark" />
                    </button>
                     <button onClick={handleToday} className="px-3 py-1.5 border border-border-light dark:border-border-dark rounded-md text-sm font-semibold hover:bg-gray-100 dark:hover:bg-primary-light/20">
                        Aujourd&apos;hui
                    </button>
                </div>
                <h3 className="text-xl font-bold text-text-main dark:text-text-main-dark text-center order-first sm:order-none">
                    Semaine du {startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-7 border-t border-l border-border-light dark:border-border-dark bg-gray-50 dark:bg-card-dark/20">
                {weekDetails.map(({ date, dayVisits, dayHolidays, dayVacations, daySpecialDate }, index) => {
                    const dateStr = toYYYYMMDD(date);
                    const isToday = toYYYYMMDD(new Date()) === dateStr;
                    
                    return (
                        <div key={index} className={`relative border-r border-b border-border-light dark:border-border-dark min-h-[10rem] ${isToday ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                            {dayVacations.length > 0 && (
                                <div className={`absolute top-0 left-0 right-0 h-1 flex`} title={dayVacations.map(v => v.name).join(', ')}>
                                    {dayVacations.map(v => <div key={v.name} className={`h-full flex-1 ${v.color}`}></div>)}
                                </div>
                            )}
                            <div className={`p-2 border-b-2 ${isToday ? 'border-primary' : 'border-transparent'}`}>
                                <p className="text-center font-bold text-sm text-text-muted dark:text-text-muted-dark uppercase">
                                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </p>
                                <p className={`text-center text-xl font-bold ${isToday ? 'text-primary dark:text-white' : 'text-text-main dark:text-text-main-dark'}`}>
                                    {date.getDate()}
                                </p>
                                <div className="text-center text-xs h-4 truncate">
                                    {dayHolidays.map(h => (
                                        <span key={h.name} title={h.name} className="text-text-muted dark:text-text-muted-dark">{countryFlags[h.country]} {h.name}</span>
                                    ))}
                                </div>
                                {daySpecialDate && (
                                    <div className="mt-1">
                                        {React.createElement(
                                            specialDateInfo[daySpecialDate.type].icon,
                                            { className: "w-3 h-3 inline" }
                                        )}
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold rounded-full ml-1 ${specialDateInfo[daySpecialDate.type].color}`} title={daySpecialDate.name}>
                                            <span className="truncate max-w-20">{daySpecialDate.name}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-2 space-y-2">
                                {dayVisits.map(visit => (
                                    <WeekVisitCard key={visit.visitId} visit={visit} onEdit={onEditVisit} />
                                ))}
                                {dayVisits.length === 0 && <div className="h-16"></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};