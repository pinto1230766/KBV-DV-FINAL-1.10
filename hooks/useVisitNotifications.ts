import React, { useEffect } from 'react';
import { Visit } from '../types';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { useSettings } from '../contexts/SettingsContext';

const formatDate = (dateString: string) => {
    // Appending 'T00:00:00' ensures the date string is parsed in the local timezone, not as UTC midnight.
    // This prevents off-by-one day errors in different timezones.
    return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// This function creates a unique numeric ID from a UUID string for notification IDs.
// It's a simple hashing mechanism to fit the numeric ID requirement of LocalNotifications.
// Returns a value within Java's int range (0 to 2147483647)
const visitIdToNumeric = (id: string): number => {
  const numericPart = id.replace(/[^0-9a-fA-F]/g, '');
  const sliced = numericPart.slice(0, 7); // Use 7 chars to stay within Java int range
  const value = parseInt(sliced, 16);
  return Math.abs(value) % 2147483647; // Ensure it's within Java int range
};


const useVisitNotifications = (
    visits: Visit[],
    // FIX: Capacitor's PermissionState can include 'prompt-with-rationale'. Widening the type to handle all possible states.
    notificationPermission: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
): void => {
    // Defensive check to ensure React is properly initialized
    if (typeof React === 'undefined' || !React.useEffect) {
        console.error('React is not properly initialized in useVisitNotifications hook');
        return;
    }

    const { settings } = useSettings();
    const { notificationSettings } = settings;

    useEffect(() => {
        const syncNotifications = async () => {
            try {
                // Check if LocalNotifications is available (non-native platforms)
                if (typeof LocalNotifications === 'undefined') {
                    console.log('LocalNotifications not available on this platform');
                    return;
                }

                // 1. Check for permissions. If not granted, we can't do anything.
                if (notificationPermission !== 'granted') {
                    // As a cleanup, cancel any pending notifications if permissions are revoked or denied.
                    const pending = await LocalNotifications.getPending();
                    if (pending.notifications.length > 0) {
                        await LocalNotifications.cancel(pending);
                    }
                    return;
                }

                // 2. Cancel all previously scheduled notifications to ensure a clean state.
                // This is the most robust way to handle changes in visit data (edits, deletions).
                const pending = await LocalNotifications.getPending();
                if (pending.notifications.length > 0) {
                    await LocalNotifications.cancel(pending);
                }

                // 3. Prepare new notifications based on the current list of visits.
                const notificationsToSchedule: LocalNotificationSchema[] = [];
                const now = new Date();
                const futureVisits = visits.filter(v => new Date(v.visitDate + 'T00:00:00') >= now && v.status !== 'cancelled');

                futureVisits.forEach(visit => {
                    const visitDate = new Date(visit.visitDate + 'T00:00:00');
                    
                    const reminderSetups = [
                        { type: 'reminder7', days: 7, title: `Rappel J-7: Visite de ${visit.nom}`, body: `Le ${formatDate(visit.visitDate)} à ${visit.visitTime}.\nAccueil par : ${visit.host}`},
                        { type: 'reminder2', days: 2, title: `Rappel J-2: Visite de ${visit.nom}`, body: `Dans 2 jours: ${formatDate(visit.visitDate)}. \nN'oubliez pas les derniers détails avec ${visit.host}.`},
                    ].filter(r => (notificationSettings as any)[r.type]); // Filter based on user settings

                    reminderSetups.forEach(setup => {
                        const notificationDateTime = new Date(visitDate);
                        notificationDateTime.setDate(visitDate.getDate() - setup.days);
                        
                        // Use user-defined notification time
                        const [hours, minutes] = notificationSettings.notificationTime.split(':').map(Number);
                        notificationDateTime.setHours(hours, minutes, 0, 0);

                        // Quiet hours logic
                        if (notificationSettings.quietHours.enabled) {
                            const quietStartHour = Number(notificationSettings.quietHours.start.split(':')[0]);
                            const quietEndHour = Number(notificationSettings.quietHours.end.split(':')[0]);
                            const notificationHour = notificationDateTime.getHours();

                            const isOvernight = quietStartHour > quietEndHour;
                            let duringQuietHours = false;
                            if (isOvernight) {
                                duringQuietHours = (notificationHour >= quietStartHour || notificationHour < quietEndHour);
                            } else {
                                duringQuietHours = (notificationHour >= quietStartHour && notificationHour < quietEndHour);
                            }

                            if (duringQuietHours) {
                                console.log(`Skipping notification for ${visit.nom} due to quiet hours.`);
                                return; // Skip scheduling this notification
                            }
                        }

                        // 4. Only schedule notifications that are in the future.
                        if (notificationDateTime > now) {
                            notificationsToSchedule.push({
                                id: visitIdToNumeric(visit.visitId) + setup.days, // Create a unique numeric ID
                                title: setup.title,
                                body: setup.body,
                                schedule: { at: notificationDateTime, allowWhileIdle: true },
                                extra: { visitId: visit.visitId }
                            });
                        }
                    });
                });

                // 5. Schedule all new notifications in one batch.
                if (notificationsToSchedule.length > 0) {
                    await LocalNotifications.schedule({ notifications: notificationsToSchedule });
                }
            } catch (e) {
                console.error("Error managing notifications:", e);
            }
        };

        syncNotifications();
        // This hook runs when visits or notification permissions change.
    }, [visits, notificationPermission, notificationSettings]); // Add notificationSettings to dependencies

// This hook is for side-effects only (scheduling notifications).
}; 

export { useVisitNotifications };