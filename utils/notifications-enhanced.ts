/**
 * Système de notifications amélioré avec gestion d'erreurs et retry
 */
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Visit } from '../types';
import { logger } from './logger';

interface NotificationConfig {
  id: number;
  title: string;
  body: string;
  schedule: Date;
  data?: Record<string, any>;
  retryCount?: number;
}

class NotificationManager {
  private maxRetries = 3;
  private retryDelay = 5000; // 5 secondes

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      logger.info('Notifications non supportées sur cette plateforme');
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      
      logger.info('Permissions notifications', { granted });
      return granted;
    } catch (error) {
      logger.error('Erreur demande permissions notifications', error as Error);
      return false;
    }
  }

  private async scheduleNotificationWithRetry(config: NotificationConfig): Promise<boolean> {
    const { retryCount = 0 } = config;

    try {
      const options: ScheduleOptions = {
        notifications: [{
          id: config.id,
          title: config.title,
          body: config.body,
          schedule: { at: config.schedule },
          extra: config.data,
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          group: 'visits'
        }]
      };

      await LocalNotifications.schedule(options);
      logger.info('Notification programmée', { id: config.id, title: config.title });
      return true;

    } catch (error) {
      logger.error('Erreur programmation notification', error as Error, { 
        id: config.id, 
        retryCount 
      });

      if (retryCount < this.maxRetries) {
        logger.info('Retry programmation notification', { id: config.id, attempt: retryCount + 1 });
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        return this.scheduleNotificationWithRetry({
          ...config,
          retryCount: retryCount + 1
        });
      }

      return false;
    }
  }

  async scheduleVisitNotifications(visit: Visit): Promise<void> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) return;

    const visitDate = new Date(visit.visitDate + 'T' + visit.visitTime);
    const now = new Date();

    // Notification 7 jours avant
    const sevenDaysBefore = new Date(visitDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (sevenDaysBefore > now) {
      await this.scheduleNotificationWithRetry({
        id: parseInt(visit.visitId.slice(-8), 16) + 1,
        title: 'Visite dans 7 jours',
        body: `${visit.nom} - ${visit.talkTheme || 'Discours public'}`,
        schedule: sevenDaysBefore,
        data: { visitId: visit.visitId, type: 'reminder-7' }
      });
    }

    // Notification 2 jours avant
    const twoDaysBefore = new Date(visitDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    if (twoDaysBefore > now) {
      await this.scheduleNotificationWithRetry({
        id: parseInt(visit.visitId.slice(-8), 16) + 2,
        title: 'Visite dans 2 jours',
        body: `${visit.nom} - Préparatifs finaux`,
        schedule: twoDaysBefore,
        data: { visitId: visit.visitId, type: 'reminder-2' }
      });
    }

    // Notification le jour même (2h avant)
    const twoHoursBefore = new Date(visitDate.getTime() - 2 * 60 * 60 * 1000);
    if (twoHoursBefore > now) {
      await this.scheduleNotificationWithRetry({
        id: parseInt(visit.visitId.slice(-8), 16) + 3,
        title: 'Visite aujourd\'hui',
        body: `${visit.nom} arrive dans 2h`,
        schedule: twoHoursBefore,
        data: { visitId: visit.visitId, type: 'today' }
      });
    }
  }

  async cancelVisitNotifications(visitId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const baseId = parseInt(visitId.slice(-8), 16);
      const notificationIds = [baseId + 1, baseId + 2, baseId + 3];

      await LocalNotifications.cancel({ notifications: notificationIds.map(id => ({ id })) });
      logger.info('Notifications annulées', { visitId, notificationIds });
    } catch (error) {
      logger.error('Erreur annulation notifications', error as Error, { visitId });
    }
  }

  async getPendingNotifications(): Promise<any[]> {
    if (!Capacitor.isNativePlatform()) return [];

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      logger.error('Erreur récupération notifications en attente', error as Error);
      return [];
    }
  }

  async clearAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const pending = await this.getPendingNotifications();
      if (pending.length > 0) {
        await LocalNotifications.cancel({ 
          notifications: pending.map(n => ({ id: n.id })) 
        });
        logger.info('Toutes les notifications supprimées', { count: pending.length });
      }
    } catch (error) {
      logger.error('Erreur suppression notifications', error as Error);
    }
  }
}

export const notificationManager = new NotificationManager();

// Fonctions utilitaires pour compatibilité
export const scheduleVisitNotifications = (visit: Visit) => 
  notificationManager.scheduleVisitNotifications(visit);

export const cancelVisitNotifications = (visitId: string) => 
  notificationManager.cancelVisitNotifications(visitId);