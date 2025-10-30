import React from 'react';
import { Visit } from '../types';
import { Avatar } from './Avatar';
import { HomeIcon, VideoCameraIcon, WifiIcon, DocumentTextIcon, CalendarIcon, ClockIcon, UserIcon, EditIcon, CheckIcon } from './Icons';

interface UnifiedVisitCardProps {
    visit: Visit;
    onEdit: (visit: Visit) => void;
    onComplete?: (visit: Visit) => void;
    showActions?: boolean;
}

export const UnifiedVisitCard: React.FC<UnifiedVisitCardProps> = ({ visit, onEdit, onComplete, showActions = true }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getLocationIcon = () => {
        switch (visit.locationType) {
            case 'zoom':
                return <VideoCameraIcon className="w-5 h-5 text-indigo-500" />;
            case 'streaming':
                return <WifiIcon className="w-5 h-5 text-purple-500" />;
            default:
                return <HomeIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusColor = () => {
        switch (visit.status) {
            case 'confirmed':
                return 'border-l-green-500';
            case 'pending':
                return 'border-l-amber-500';
            case 'cancelled':
                return 'border-l-red-500';
            default:
                return 'border-l-gray-500';
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${getStatusColor()} p-4 hover:shadow-lg transition-shadow`}>
            {/* En-tête avec date */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{formatDate(visit.visitDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <ClockIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{visit.visitTime}</span>
                </div>
            </div>

            {/* Informations orateur */}
            <div className="flex items-start gap-3 mb-3">
                <Avatar item={visit} size="w-12 h-12" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{visit.nom}</h3>
                        {getLocationIcon()}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{visit.congregation}</p>
                </div>
            </div>

            {/* Thème du discours */}
            {visit.talkTheme && (
                <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        {visit.talkNoOrType && (
                            <span className="text-sm font-semibold text-primary dark:text-primary-light">
                                N°{visit.talkNoOrType} -{' '}
                            </span>
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">{visit.talkTheme}</span>
                    </div>
                </div>
            )}

            {/* Accueil */}
            {visit.host && visit.host !== 'Pas d\'accueil nécessaire' && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Accueil :</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{visit.host}</span>
                </div>
            )}

            {/* Actions */}
            {showActions && (
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => onEdit(visit)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                    >
                        <EditIcon className="w-4 h-4" />
                        Modifier
                    </button>
                    {onComplete && (
                        <button
                            onClick={() => onComplete(visit)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                            <CheckIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
