import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, LockClosedIcon, EyeSlashIcon, ClockIcon } from './Icons';
import { useData } from '../contexts/DataContext';

export const SecurityStatus: React.FC = () => {
    const { isEncrypted, extendSession } = useData();
    const [securitySettings, setSecuritySettings] = useState<any>(null);

    useEffect(() => {
        const loadSettings = () => {
            try {
                const stored = localStorage.getItem('securitySettings');
                if (stored) {
                    setSecuritySettings(JSON.parse(stored));
                }
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres de sécurité:', error);
            }
        };

        loadSettings();
        
        // Écouter les changements de paramètres
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'securitySettings') {
                loadSettings();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    if (!securitySettings) return null;

    const activeFeatures = [];
    
    if (isEncrypted) {
        activeFeatures.push({
            icon: LockClosedIcon,
            label: 'Chiffrement activé',
            color: 'text-green-600 dark:text-green-400'
        });
    }

    if (securitySettings.hidePhoneNumbers || securitySettings.hideAddresses) {
        activeFeatures.push({
            icon: EyeSlashIcon,
            label: 'Données masquées',
            color: 'text-blue-600 dark:text-blue-400'
        });
    }

    if (securitySettings.sessionTimeout > 0) {
        activeFeatures.push({
            icon: ClockIcon,
            label: `Session: ${securitySettings.sessionTimeout}min`,
            color: 'text-amber-600 dark:text-amber-400'
        });
    }

    if (activeFeatures.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Sécurité active
                    </span>
                </div>
                
                <div className="space-y-1">
                    {activeFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <feature.icon className={`w-3 h-3 ${feature.color}`} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                {feature.label}
                            </span>
                        </div>
                    ))}
                </div>

                {securitySettings.sessionTimeout > 0 && (
                    <button
                        onClick={extendSession}
                        className="mt-2 w-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        Prolonger la session
                    </button>
                )}
            </div>
        </div>
    );
};