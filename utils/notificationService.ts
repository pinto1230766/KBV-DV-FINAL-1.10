import { LocalNotifications } from '@capacitor/local-notifications';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  private static hasPermission = false;

  /**
   * Demande les permissions pour les notifications locales
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications non disponibles sur le web');
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      this.hasPermission = result.display === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  /**
   * Vérifie si les permissions sont accordées
   */
  static async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      this.hasPermission = result.display === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Affiche une notification pour un message d'orateur
   */
  static async showSpeakerMessageNotification(
    speakerName: string,
    speakerId: string,
    speakerPhone: string
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notification web non implémentée');
      return;
    }

    // Vérifier les permissions
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        console.error('Permissions de notification refusées');
        return;
      }
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: '💬 Nouveau message WhatsApp',
            body: `Message de ${speakerName}`,
            schedule: { at: new Date(Date.now() + 100) }, // Immédiat
            sound: undefined, // Son par défaut
            actionTypeId: 'OPEN_WHATSAPP',
            extra: {
              speakerId,
              speakerPhone,
              speakerName,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Erreur lors de l\'affichage de la notification:', error);
    }
  }

  /**
   * Ouvre WhatsApp avec le numéro de téléphone spécifié
   */
  static async openWhatsApp(phoneNumber: string, message?: string): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = message ? encodeURIComponent(message) : '';
    const url = message 
      ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
      : `https://wa.me/${formattedPhone}`;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await AppLauncher.openUrl({ url });
      } catch (error) {
        console.error('Erreur lors de l\'ouverture de WhatsApp via AppLauncher:', error);
        // Fallback
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Formate un numéro de téléphone pour WhatsApp
   */
  private static formatPhoneNumber(phone: string): string {
    if (!phone || phone.trim() === '') return '';
    
    // Nettoyer le numéro
    const cleaned = phone.replace(/[\s.-]/g, '');
    
    // Si commence par +, on garde tel quel
    if (cleaned.startsWith('+')) {
      return cleaned.substring(1); // wa.me/ n'a pas besoin du +
    }
    
    // Si commence par 00, on remplace par rien
    if (cleaned.startsWith('00')) {
      return cleaned.substring(2);
    }
    
    // Si commence par 0 (numéro français), on ajoute 33
    if (cleaned.startsWith('0')) {
      return `33${cleaned.substring(1)}`;
    }
    
    // Sinon on retourne tel quel
    return cleaned;
  }

  /**
   * Annule toutes les notifications en attente
   */
  static async cancelAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }
}
