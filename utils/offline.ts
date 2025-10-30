import { logger } from './logger';
import { analytics } from './analytics';

interface OfflineQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineManager {
  private queue: OfflineQueueItem[] = [];
  private isOnline = navigator.onLine;
  private maxRetries = 3;

  constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Connexion rétablie');
      analytics.track('connection_restored');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.warn('Connexion perdue');
      analytics.track('connection_lost');
    });
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Erreur chargement queue offline', error as Error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      logger.error('Erreur sauvegarde queue offline', error as Error);
    }
  }

  addToQueue(action: string, data: any): string {
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: OfflineQueueItem = {
      id,
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(item);
    this.saveQueue();
    
    logger.info('Action ajoutée à la queue offline', { action, id });
    return id;
  }

  async processQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    logger.info('Traitement de la queue offline', { queueSize: this.queue.length });

    const itemsToProcess = [...this.queue];
    this.queue = [];

    for (const item of itemsToProcess) {
      try {
        await this.processItem(item);
        logger.info('Action offline traitée avec succès', { action: item.action, id: item.id });
      } catch (error) {
        item.retries++;
        if (item.retries < this.maxRetries) {
          this.queue.push(item);
          logger.warn('Échec traitement action offline, réessai', { 
            action: item.action, 
            id: item.id, 
            retries: item.retries 
          });
        } else {
          logger.error('Action offline abandonnée après échecs répétés', error as Error, {
            action: item.action,
            id: item.id,
            retries: item.retries
          });
        }
      }
    }

    this.saveQueue();
  }

  private async processItem(item: OfflineQueueItem) {
    // Ici on pourrait traiter différents types d'actions
    switch (item.action) {
      case 'sync_data':
        // Synchronisation des données
        break;
      case 'send_message':
        // Envoi de message
        break;
      default:
        logger.warn('Action offline inconnue', { action: item.action });
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
    logger.info('Queue offline vidée');
  }

  isOffline(): boolean {
    return !this.isOnline;
  }
}

export const offlineManager = new OfflineManager();