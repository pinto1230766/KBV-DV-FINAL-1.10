import React, { useState, useEffect } from 'react';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CameraIcon, MapPinIcon, BellIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from './Icons';
import { Capacitor } from '@capacitor/core';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

interface Permission {
    name: string;
    description: string;
    icon: React.FC<any>;
    status: PermissionStatus;
    onRequest: () => Promise<void>;
    usage: string;
}

export const PermissionsManager: React.FC = () => {
    const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('prompt');
    const [locationStatus, setLocationStatus] = useState<PermissionStatus>('prompt');
    const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('prompt');
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        checkAllPermissions();
    }, []);

    const checkAllPermissions = async () => {
        // Camera
        try {
            const camera = await Camera.checkPermissions();
            setCameraStatus(camera.camera === 'granted' ? 'granted' : camera.camera === 'denied' ? 'denied' : 'prompt');
        } catch {
            setCameraStatus('unavailable');
        }

        // Location
        try {
            const location = await Geolocation.checkPermissions();
            setLocationStatus(location.location === 'granted' ? 'granted' : location.location === 'denied' ? 'denied' : 'prompt');
        } catch {
            setLocationStatus('unavailable');
        }

        // Notifications
        try {
            const notifications = await LocalNotifications.checkPermissions();
            setNotificationStatus(notifications.display === 'granted' ? 'granted' : notifications.display === 'denied' ? 'denied' : 'prompt');
        } catch {
            setNotificationStatus('unavailable');
        }
    };

    const requestCamera = async () => {
        try {
            const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
            setCameraStatus(result.camera === 'granted' ? 'granted' : 'denied');
        } catch (error) {
            console.error('Camera permission error:', error);
        }
    };

    const requestLocation = async () => {
        try {
            const result = await Geolocation.requestPermissions();
            setLocationStatus(result.location === 'granted' ? 'granted' : 'denied');
        } catch (error) {
            console.error('Location permission error:', error);
        }
    };

    const requestNotifications = async () => {
        try {
            const result = await LocalNotifications.requestPermissions();
            setNotificationStatus(result.display === 'granted' ? 'granted' : 'denied');
        } catch (error) {
            console.error('Notification permission error:', error);
        }
    };

    const permissions: Permission[] = [
        {
            name: 'Appareil photo',
            description: 'Permet de prendre des photos pour les profils des orateurs et contacts d\'accueil',
            icon: CameraIcon,
            status: cameraStatus,
            onRequest: requestCamera,
            usage: 'Utilisé lors de l\'ajout/modification d\'un orateur ou contact'
        },
        {
            name: 'Géolocalisation',
            description: 'Permet de définir la position de la salle du Royaume et calculer les itinéraires',
            icon: MapPinIcon,
            status: locationStatus,
            onRequest: requestLocation,
            usage: 'Utilisé dans les paramètres de la congrégation'
        },
        {
            name: 'Notifications',
            description: 'Permet de recevoir des rappels automatiques avant les visites (7j, 2j, jour J)',
            icon: BellIcon,
            status: notificationStatus,
            onRequest: requestNotifications,
            usage: 'Rappels programmés automatiquement pour chaque visite'
        }
    ];

    const getStatusBadge = (status: PermissionStatus) => {
        switch (status) {
            case 'granted':
                return (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                        <CheckCircleIcon className="w-4 h-4" />
                        Autorisé
                    </div>
                );
            case 'denied':
                return (
                    <div className="flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold">
                        <XCircleIcon className="w-4 h-4" />
                        Refusé
                    </div>
                );
            case 'unavailable':
                return (
                    <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-semibold">
                        <XCircleIcon className="w-4 h-4" />
                        Non disponible
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Non demandé
                    </div>
                );
        }
    };

    if (!isNative) {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            Version Web
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            La gestion des permissions est disponible uniquement sur l'application mobile native (Android/iOS).
                            Sur le web, les permissions sont demandées automatiquement lors de l'utilisation des fonctionnalités.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            À propos des permissions
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Ces permissions sont optionnelles et améliorent votre expérience. 
                            Si une permission est refusée, vous pouvez la réactiver dans les paramètres de votre appareil.
                        </p>
                    </div>
                </div>
            </div>

            {permissions.map((permission) => (
                <div
                    key={permission.name}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg flex-shrink-0">
                                <permission.icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {permission.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {permission.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                    💡 {permission.usage}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(permission.status)}
                            {permission.status !== 'granted' && permission.status !== 'unavailable' && (
                                <button
                                    onClick={permission.onRequest}
                                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Autoriser
                                </button>
                            )}
                            {permission.status === 'denied' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-right max-w-[150px]">
                                    Modifiez dans les paramètres de l'appareil
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
