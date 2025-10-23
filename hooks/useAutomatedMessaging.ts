import { useEffect, useCallback } from 'react';
import { Visit, MessageType, MessageRole } from '../types';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

interface AutomatedMessageConfig {
  visit: Visit;
  messageType: MessageType;
  role: MessageRole;
  delay?: number; // Délai en millisecondes avant envoi
}

const useAutomatedMessaging = (visits: Visit[]) => {
  const { logCommunication } = useData();
  const { addToast: showToast } = useToast();

  // Fonction pour obtenir le numéro de téléphone de l'hôte
  const getHostPhone = useCallback((): string | null => {
    // Cette fonction devrait être étendue pour récupérer le numéro depuis les données des hôtes
    // Pour l'instant, on retourne null car cette information n'est pas disponible
    console.warn('Récupération du numéro de téléphone de l\'hôte non implémentée');
    return null;
  }, []);

  // Fonction pour obtenir l'adresse de l'hôte (à implémenter)
  const getHostAddress = useCallback((): string | null => {
    // Cette fonction devrait récupérer l'adresse depuis les données des hôtes
    console.warn('Récupération de l\'adresse de l\'hôte non implémentée');
    return null;
  }, []);

  // Fonction pour générer le message selon le type et le rôle
  const generateMessage = useCallback((visit: Visit, messageType: MessageType, role: MessageRole): string | null => {
    const visitDate = new Date(visit.visitDate).toLocaleDateString('fr-FR');
    const congregationName = 'KBV DV Lyon'; // À récupérer depuis les paramètres

    switch (messageType) {
      case 'confirmation':
        if (role === 'speaker') {
          return `Bonjour ${visit.nom},

Votre visite à la congrégation ${congregationName} est confirmée pour le ${visitDate} à ${visit.visitTime}.

Accueil par : ${visit.host}
Hébergement : ${visit.accommodation || 'À définir'}
Repas : ${visit.meals || 'À définir'}

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
KBV DV Lyon`;
        } else if (role === 'host') {
          return `Bonjour ${visit.host},

Vous êtes désigné(e) pour accueillir ${visit.nom} (${visit.congregation}) le ${visitDate} à ${visit.visitTime}.

Discours : ${visit.talkNoOrType || 'À définir'} - ${visit.talkTheme || 'À définir'}

Merci de votre disponibilité !

Cordialement,
KBV DV Lyon`;
        }
        break;

      case 'preparation':
        if (role === 'speaker') {
          return `Bonjour ${visit.nom},

Rappel de votre visite à ${congregationName} demain ${visitDate}.

Heure : ${visit.visitTime}
Accueil par : ${visit.host}
Adresse : ${getHostAddress() || 'À confirmer'}

N'oubliez pas votre discours : ${visit.talkNoOrType || 'À définir'} - ${visit.talkTheme || 'À définir'}

Au plaisir de vous accueillir !

Cordialement,
KBV DV Lyon`;
        } else if (role === 'host') {
          return `Bonjour ${visit.host},

Rappel : Vous accueillez ${visit.nom} demain ${visitDate} à ${visit.visitTime}.

Discours : ${visit.talkNoOrType || 'À définir'} - ${visit.talkTheme || 'À définir'}

Préparez-vous pour une belle visite !

Cordialement,
KBV DV Lyon`;
        }
        break;

      case 'reminder-7':
        if (role === 'speaker') {
          return `Bonjour ${visit.nom},

Rappel : Votre visite à ${congregationName} est programmée dans 7 jours (le ${visitDate}).

Si vous avez des questions ou besoin d'informations supplémentaires, contactez-nous.

Cordialement,
KBV DV Lyon`;
        }
        break;

      case 'reminder-2':
        if (role === 'speaker') {
          return `Bonjour ${visit.nom},

Rappel : Votre visite à ${congregationName} approche (dans 2 jours - ${visitDate}).

Accueil par : ${visit.host}
Hébergement : ${visit.accommodation || 'À confirmer'}
Repas : ${visit.meals || 'À confirmer'}

Cordialement,
KBV DV Lyon`;
        }
        break;

      case 'thanks':
        if (role === 'speaker') {
          return `Bonjour ${visit.nom},

Merci infiniment pour votre visite à ${congregationName} !

Nous avons été ravis de vous accueillir et d'entendre votre discours "${visit.talkTheme || 'À définir'}".

Vos retours sont les bienvenus pour améliorer nos futures visites.

Cordialement,
KBV DV Lyon`;
        } else if (role === 'host') {
          return `Bonjour ${visit.host},

Un grand merci pour votre accueil de ${visit.nom} !

Votre disponibilité et votre hospitalité ont contribué au succès de cette visite.

Cordialement,
KBV DV Lyon`;
        }
        break;
    }

    return null;
  }, [getHostAddress]);

  // Fonction pour envoyer un message WhatsApp automatiquement
  const sendAutomatedMessage = useCallback(async (config: AutomatedMessageConfig) => {
    const { visit, messageType, role, delay = 0 } = config;

    // Attendre le délai spécifié
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      // Générer le message selon le type et le rôle
      const message = generateMessage(visit, messageType, role);

      if (!message) {
        console.warn(`Impossible de générer le message pour ${messageType} - ${role}`);
        return;
      }

      // Ouvrir WhatsApp avec le message
      const phoneNumber = role === 'speaker' ? visit.telephone : getHostPhone();
      if (!phoneNumber) {
        console.warn(`Numéro de téléphone manquant pour ${role} de la visite ${visit.visitId}`);
        return;
      }

      const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;

      // Ouvrir WhatsApp dans un nouvel onglet
      const whatsappWindow = window.open(whatsappUrl, '_blank');

      if (whatsappWindow) {
        // Marquer la communication comme envoyée
        logCommunication(visit.visitId, messageType, role);

        showToast(`Message ${messageType} envoyé automatiquement à ${role === 'speaker' ? visit.nom : visit.host}`, 'success');
      } else {
        console.error('Impossible d\'ouvrir WhatsApp automatiquement');
        showToast('Erreur lors de l\'envoi automatique du message WhatsApp', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi automatique du message:', error);
      showToast('Erreur lors de l\'envoi automatique du message', 'error');
    }
  }, [logCommunication, showToast, generateMessage, getHostPhone]);




  // Hook principal qui surveille les visites et déclenche les messages automatiques
  useEffect(() => {
    const now = new Date();
    const automatedMessages: AutomatedMessageConfig[] = [];

    visits.forEach(visit => {
      const visitDate = new Date(visit.visitDate + 'T00:00:00');
      const daysUntilVisit = Math.ceil((visitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceVisit = Math.ceil((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

      // Vérifier si les messages n'ont pas déjà été envoyés
      const commStatus = visit.communicationStatus || {};

      // Message de rappel 7 jours avant (pour l'orateur uniquement)
      if (daysUntilVisit === 7 && !commStatus['reminder-7']?.speaker) {
        automatedMessages.push({
          visit,
          messageType: 'reminder-7',
          role: 'speaker',
          delay: Math.random() * 5000 // Délai aléatoire pour éviter la surcharge
        });
      }

      // Message de préparation 2 jours avant
      if (daysUntilVisit === 2) {
        if (!commStatus.preparation?.speaker) {
          automatedMessages.push({
            visit,
            messageType: 'preparation',
            role: 'speaker',
            delay: Math.random() * 3000
          });
        }
        if (!commStatus.preparation?.host && visit.host !== 'N/A') {
          automatedMessages.push({
            visit,
            messageType: 'preparation',
            role: 'host',
            delay: Math.random() * 3000 + 2000 // Délai supplémentaire pour l'hôte
          });
        }
      }

      // Message de rappel 1 jour avant (pour l'orateur uniquement)
      if (daysUntilVisit === 1 && !commStatus['reminder-2']?.speaker) {
        automatedMessages.push({
          visit,
          messageType: 'reminder-2',
          role: 'speaker',
          delay: Math.random() * 2000
        });
      }

      // Notification pour formulaire de frais manquant (3 jours après visite)
      if (daysSinceVisit === 3 &&
          visit.status === 'completed' &&
          visit.locationType === 'physical' &&
          (!visit.expenseStatus || visit.expenseStatus === 'not_sent' || visit.expenseStatus === 'sent') &&
          !visit.expenseFormUrl) {
        // Créer une notification pour rappeler le formulaire de frais manquant
        const notificationMessage = `Rappel : Le formulaire de frais pour la visite de ${visit.nom} (${new Date(visit.visitDate).toLocaleDateString('fr-FR')}) n'a pas encore été reçu.`;
        showToast(notificationMessage, 'warning');
        console.log(`Notification générée pour formulaire de frais manquant: ${visit.nom}`);
      }
    });

    // Envoyer les messages automatiques
    automatedMessages.forEach(config => {
      sendAutomatedMessage(config);
    });
  }, [visits, sendAutomatedMessage, showToast]);

  // Fonction pour déclencher manuellement un message automatique
  const triggerAutomatedMessage = useCallback((visit: Visit, messageType: MessageType, role: MessageRole) => {
    sendAutomatedMessage({ visit, messageType, role });
  }, [sendAutomatedMessage]);

  return {
    triggerAutomatedMessage,
    sendAutomatedMessage
  };
};

export default useAutomatedMessaging;