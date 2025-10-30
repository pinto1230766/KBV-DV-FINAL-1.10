import React, { useState, useMemo } from 'react';
import { Visit } from '../types';
import { SearchIcon, TrashIcon, CalendarIcon, StarIcon, ChartBarIcon, UserIcon, HomeIcon } from './Icons';
import { useData } from '../contexts/DataContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface ArchiveTabProps {
    onLeaveFeedback: (visit: Visit) => void;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = ({ onLeaveFeedback }) => {
    const { archivedVisits, deleteArchivedVisit, speakers, hosts } = useData();
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterHost, setFilterHost] = useState<string>('all');

    const years = useMemo(() => {
        const yearsSet = new Set(archivedVisits.map(v => new Date(v.visitDate).getFullYear()));
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [archivedVisits]);

    const hostStats = useMemo(() => {
        const stats = new Map<string, number>();
        archivedVisits.forEach(v => {
            stats.set(v.host, (stats.get(v.host) || 0) + 1);
        });
        return Array.from(stats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [archivedVisits]);

    const speakerStats = useMemo(() => {
        const stats = new Map<string, number>();
        archivedVisits.forEach(v => {
            stats.set(v.nom, (stats.get(v.nom) || 0) + 1);
        });
        return Array.from(stats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [archivedVisits]);

    const filteredVisits = useMemo(() => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        return archivedVisits
            .filter(v => {
                const matchesSearch = v.nom.toLowerCase().includes(lowerCaseTerm) ||
                    v.congregation.toLowerCase().includes(lowerCaseTerm) ||
                    v.host.toLowerCase().includes(lowerCaseTerm);
                const matchesYear = filterYear === 'all' || new Date(v.visitDate).getFullYear().toString() === filterYear;
                const matchesHost = filterHost === 'all' || v.host === filterHost;
                return matchesSearch && matchesYear && matchesHost;
            })
            .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
    }, [archivedVisits, searchTerm, filterYear, filterHost]);

    const handleDelete = async (visit: Visit) => {
        const visitDate = new Date(visit.visitDate).toLocaleDateString('fr-FR');
        if (await confirm(`Supprimer définitivement la visite de ${visit.nom} du ${visitDate} ?`)) {
            deleteArchivedVisit(visit.visitId);
        }
    };

    return (
        <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{archivedVisits.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Visites archivées</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <UserIcon className="w-8 h-8 text-secondary" />
                        <div>
                            <p className="text-2xl font-bold">{speakerStats.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Orateurs différents</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <HomeIcon className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-2xl font-bold">{hostStats.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Contacts d'accueil</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top 10 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-primary" />
                        Top 10 Orateurs
                    </h3>
                    <div className="space-y-2">
                        {speakerStats.map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center">
                                <span className="text-sm truncate">{name}</span>
                                <span className="font-semibold text-primary">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-green-600" />
                        Top 10 Accueils
                    </h3>
                    <div className="space-y-2">
                        {hostStats.map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center">
                                <span className="text-sm truncate">{name}</span>
                                <span className="font-semibold text-green-600">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                        <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    </div>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="all">Toutes les années</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <select
                        value={filterHost}
                        onChange={e => setFilterHost(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="all">Tous les accueils</option>
                        {hostStats.map(([name]) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Liste des visites */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="font-bold text-lg mb-4">Visites archivées ({filteredVisits.length})</h3>
                {filteredVisits.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredVisits.map(visit => (
                            <div key={visit.visitId} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{visit.nom}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{visit.congregation}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(visit.visitDate).toLocaleDateString('fr-FR')} - {visit.host}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {visit.feedback ? (
                                        <div className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            <StarIcon className="w-4 h-4" />
                                            Avis
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onLeaveFeedback(visit)}
                                            className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs"
                                        >
                                            Avis
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(visit)}
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-full"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <CalendarIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Aucune visite trouvée</p>
                    </div>
                )}
            </div>
        </div>
    );
};
