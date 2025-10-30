import { LocalNotifications } from '@capacitor/local-notifications';
import { Visit } from '../types';

export async function scheduleVisitNotifications(visit: Visit): Promise<void> {
    try {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display !== 'granted') return;

        const visitDate = new Date(visit.visitDate + 'T' + visit.visitTime);
        const now = new Date();

        // Notification 7 jours avant
        const sevenDaysBefore = new Date(visitDate);
        sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
        sevenDaysBefore.setHours(9, 0, 0, 0);

        // Notification 2 jours avant
        const twoDaysBefore = new Date(visitDate);
        twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
        twoDaysBefore.setHours(9, 0, 0, 0);

        // Notification le jour même
        const sameDay = new Date(visitDate);
        sameDay.setHours(8, 0, 0, 0);

        const notifications = [];

        if (sevenDaysBefore > now) {
            notifications.push({
                id: parseInt(`${visit.visitId.slice(-6)}1`),
                title: '📅 Visite dans 7 jours',
                body: `${visit.nom} - ${visit.congregation}`,
                schedule: { at: sevenDaysBefore }
            });
        }

        if (twoDaysBefore > now) {
            notifications.push({
                id: parseInt(`${visit.visitId.slice(-6)}2`),
                title: '⏰ Visite dans 2 jours',
                body: `${visit.nom} - ${visit.congregation}`,
                schedule: { at: twoDaysBefore }
            });
        }

        if (sameDay > now) {
            notifications.push({
                id: parseInt(`${visit.visitId.slice(-6)}3`),
                title: '🎤 Visite aujourd\'hui',
                body: `${visit.nom} à ${visit.visitTime}`,
                schedule: { at: sameDay }
            });
        }

        if (notifications.length > 0) {
            await LocalNotifications.schedule({ notifications });
        }
    } catch (error) {
        console.error('Erreur lors de la planification des notifications:', error);
    }
}

export async function cancelVisitNotifications(visitId: string): Promise<void> {
    try {
        const ids = [
            parseInt(`${visitId.slice(-6)}1`),
            parseInt(`${visitId.slice(-6)}2`),
            parseInt(`${visitId.slice(-6)}3`)
        ];
        await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
    } catch (error) {
        console.error('Erreur lors de l\'annulation des notifications:', error);
    }
}
