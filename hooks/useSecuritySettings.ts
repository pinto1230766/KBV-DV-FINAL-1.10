import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export interface SecuritySettings {
    autoLockTimeout: number; // minutes
    requirePasswordOnStart: boolean;
    encryptSensitiveData: boolean;
    clearClipboardAfter: number; // seconds
    hidePhoneNumbers: boolean;
    hideAddresses: boolean;
    logSecurityEvents: boolean;
    allowScreenshots: boolean;
    sessionTimeout: number; // minutes
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    autoLockTimeout: 30,
    requirePasswordOnStart: true,
    encryptSensitiveData: true,
    clearClipboardAfter: 30,
    hidePhoneNumbers: false,
    hideAddresses: false,
    logSecurityEvents: true,
    allowScreenshots: true,
    sessionTimeout: 120
};

const STORAGE_KEY = 'securitySettings';

export const useSecuritySettings = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Charger les paramètres au démarrage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({ ...DEFAULT_SECURITY_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres de sécurité:', error);
            addToast('Erreur lors du chargement des paramètres de sécurité', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    // Sauvegarder les paramètres
    const saveSettings = useCallback((newSettings: Partial<SecuritySettings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
            addToast('Paramètres de sécurité sauvegardés', 'success');
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            addToast('Erreur lors de la sauvegarde des paramètres', 'error');
            return false;
        }
    }, [settings, addToast]);

    // Appliquer les paramètres de sécurité
    const applySecuritySettings = useCallback(() => {
        // Masquer les captures d'écran si nécessaire
        if (!settings.allowScreenshots) {
            document.body.style.setProperty('-webkit-user-select', 'none');
            document.body.style.setProperty('-moz-user-select', 'none');
            document.body.style.setProperty('-ms-user-select', 'none');
            document.body.style.setProperty('user-select', 'none');
        } else {
            document.body.style.removeProperty('-webkit-user-select');
            document.body.style.removeProperty('-moz-user-select');
            document.body.style.removeProperty('-ms-user-select');
            document.body.style.removeProperty('user-select');
        }

        // Configurer le timeout de session
        if (settings.sessionTimeout > 0) {
            // Cette logique sera gérée par le DataContext
            localStorage.setItem('sessionTimeout', settings.sessionTimeout.toString());
        }
    }, [settings]);

    // Appliquer les paramètres quand ils changent
    useEffect(() => {
        if (!isLoading) {
            applySecuritySettings();
        }
    }, [settings, isLoading, applySecuritySettings]);

    // Masquer les données sensibles
    const maskSensitiveData = useCallback((data: string, type: 'phone' | 'address'): string => {
        if (type === 'phone' && settings.hidePhoneNumbers) {
            return data.replace(/\d/g, '*').slice(0, -4) + data.slice(-4);
        }
        if (type === 'address' && settings.hideAddresses) {
            const parts = data.split(',');
            return parts.map((part, index) => 
                index === 0 ? part.replace(/\d+/g, '***') : part
            ).join(',');
        }
        return data;
    }, [settings]);

    // Effacer le presse-papiers après un délai
    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            addToast('Copié dans le presse-papiers', 'success');
            
            if (settings.clearClipboardAfter > 0) {
                setTimeout(async () => {
                    try {
                        await navigator.clipboard.writeText('');
                    } catch (error) {
                        console.log('Impossible d\'effacer le presse-papiers');
                    }
                }, settings.clearClipboardAfter * 1000);
            }
        } catch (error) {
            addToast('Erreur lors de la copie', 'error');
        }
    }, [settings.clearClipboardAfter, addToast]);

    return {
        settings,
        isLoading,
        saveSettings,
        maskSensitiveData,
        copyToClipboard,
        applySecuritySettings
    };
};