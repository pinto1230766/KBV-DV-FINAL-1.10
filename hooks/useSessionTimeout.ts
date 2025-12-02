import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

interface UseSessionTimeoutProps {
    onTimeout: () => void;
    isActive: boolean;
}

export const useSessionTimeout = ({ onTimeout, isActive }: UseSessionTimeoutProps) => {
    const { addToast } = useToast();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    // Récupérer le timeout depuis les paramètres de sécurité
    const getSessionTimeout = useCallback(() => {
        try {
            const securitySettings = localStorage.getItem('securitySettings');
            if (securitySettings) {
                const parsed = JSON.parse(securitySettings);
                return (parsed.sessionTimeout || 120) * 60 * 1000; // Convertir en millisecondes
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du timeout de session:', error);
        }
        return 120 * 60 * 1000; // 2 heures par défaut
    }, []);

    // Réinitialiser le timer
    const resetTimer = useCallback(() => {
        if (!isActive) return;

        const timeout = getSessionTimeout();
        if (timeout <= 0) return; // Timeout désactivé

        lastActivityRef.current = Date.now();

        // Effacer les timers existants
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }

        // Avertissement 5 minutes avant l'expiration
        const warningTime = Math.max(timeout - 5 * 60 * 1000, timeout * 0.8);
        warningTimeoutRef.current = setTimeout(() => {
            addToast(
                'Votre session expirera dans 5 minutes. Effectuez une action pour la prolonger.',
                'warning',
                10000
            );
        }, warningTime);

        // Timer principal
        timeoutRef.current = setTimeout(() => {
            addToast('Session expirée pour des raisons de sécurité.', 'error');
            onTimeout();
        }, timeout);
    }, [isActive, getSessionTimeout, onTimeout, addToast]);

    // Événements d'activité utilisateur
    const handleUserActivity = useCallback(() => {
        if (!isActive) return;
        
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        
        // Réinitialiser seulement si plus de 30 secondes se sont écoulées
        if (timeSinceLastActivity > 30000) {
            resetTimer();
        }
    }, [isActive, resetTimer]);

    // Configurer les écouteurs d'événements
    useEffect(() => {
        if (!isActive) {
            // Nettoyer les timers si inactif
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
                warningTimeoutRef.current = null;
            }
            return;
        }

        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Ajouter les écouteurs
        events.forEach(event => {
            document.addEventListener(event, handleUserActivity, { passive: true });
        });

        // Démarrer le timer initial
        resetTimer();

        // Nettoyer à la désactivation
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserActivity);
            });
            
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
        };
    }, [isActive, handleUserActivity, resetTimer]);

    // Fonction pour prolonger manuellement la session
    const extendSession = useCallback(() => {
        if (isActive) {
            resetTimer();
            addToast('Session prolongée.', 'success');
        }
    }, [isActive, resetTimer, addToast]);

    return {
        extendSession,
        resetTimer
    };
};