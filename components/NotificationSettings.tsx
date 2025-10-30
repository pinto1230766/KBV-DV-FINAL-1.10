import React, { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BellIcon, CheckIcon } from './Icons';

export const NotificationSettings: React.FC = () => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const result = await LocalNotifications.checkPermissions();
            setEnabled(result.display === 'granted');
        } catch (error) {
            console.error('Erreur vérification permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleNotifications = async () => {
        try {
            if (!enabled) {
                const result = await LocalNotifications.requestPermissions();
                setEnabled(result.display === 'granted');
            }
        } catch (error) {
            console.error('Erreur activation notifications:', error);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BellIcon className="w-6 h-6 text-primary" />
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications automatiques
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Rappels 7j, 2j et le jour de la visite
                        </p>
                    </div>
                </div>
                <button
                    onClick={toggleNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
            {enabled && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckIcon className="w-4 h-4" />
                    <span>Notifications activées</span>
                </div>
            )}
        </div>
    );
};
