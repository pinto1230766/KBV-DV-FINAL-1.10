/**
 * Système d'analytics simple et respectueux de la vie privée
 */
import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

interface UsageStats {
  totalVisits: number;
  totalSpeakers: number;
  totalHosts: number;
  averageVisitsPerMonth: number;
  mostUsedFeatures: Array<{ feature: string; count: number }>;
  lastUsed: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private readonly STORAGE_KEY = 'app_analytics';
  private readonly API_ENDPOINT = process.env.REACT_APP_ANALYTICS_ENDPOINT || null;

  constructor() {
    this.loadEvents();
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Erreur chargement analytics', error as Error);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      // Garder seulement les événements récents
      if (this.events.length > this.MAX_EVENTS) {
        this.events = this.events.slice(-this.MAX_EVENTS);
      }

      // Essayer de sérialiser, sinon nettoyer les événements problématiques
      let eventsToSave = this.events;
      try {
        JSON.stringify(eventsToSave);
      } catch (serializeError) {
        logger.warn('Erreur sérialisation analytics, nettoyage des événements', serializeError as Error);
        // Nettoyer les événements avec des propriétés problématiques
        eventsToSave = this.events.map(event => ({
          ...event,
          properties: this.sanitizeProperties(event.properties)
        })).filter(event => {
          try {
            JSON.stringify(event);
            return true;
          } catch {
            return false;
          }
        });
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventsToSave));
    } catch (error) {
      logger.error('Erreur sauvegarde analytics', error as Error);
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date().toISOString()
    };

    this.events.push(event);
    this.saveEvents();

    logger.debug('Event tracked', { eventName, properties });
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'phone', 'email'];

    for (const [key, value] of Object.entries(properties)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  getUsageStats(appData?: any): UsageStats {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Compter les événements par feature
    const featureCounts: Record<string, number> = {};
    
    this.events
      .filter(event => new Date(event.timestamp) >= thirtyDaysAgo)
      .forEach(event => {
        featureCounts[event.name] = (featureCounts[event.name] || 0) + 1;
      });

    const mostUsedFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const lastUsedEvent = this.events[this.events.length - 1];

    return {
      totalVisits: appData?.visits?.length || 0,
      totalSpeakers: appData?.speakers?.length || 0,
      totalHosts: appData?.hosts?.length || 0,
      averageVisitsPerMonth: this.calculateAverageVisitsPerMonth(appData?.visits || []),
      mostUsedFeatures,
      lastUsed: lastUsedEvent?.timestamp || new Date().toISOString()
    };
  }

  private calculateAverageVisitsPerMonth(visits: any[]): number {
    if (!visits.length) return 0;

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    const recentVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      return visitDate >= sixMonthsAgo && visitDate <= now;
    });

    return Math.round(recentVisits.length / 6);
  }

  getEventsByType(eventName: string, days: number = 30): AnalyticsEvent[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.events.filter(event => 
      event.name === eventName && 
      new Date(event.timestamp) >= cutoffDate
    );
  }

  clearAnalytics(): void {
    this.events = [];
    localStorage.removeItem(this.STORAGE_KEY);
    logger.info('Analytics cleared');
  }

  exportAnalytics(): string {
    return JSON.stringify({
      events: this.events,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }
}

export const analytics = new Analytics();

// Fonctions utilitaires pour tracker les événements courants
export const trackVisitCreated = (visitType: string) => 
  analytics.track('visit_created', { type: visitType });

export const trackMessageSent = (messageType: string, role: string) => 
  analytics.track('message_sent', { type: messageType, role });

export const trackFeatureUsed = (feature: string) => 
  analytics.track('feature_used', { feature });

export const trackError = (error: string, context?: string) => 
  analytics.track('error_occurred', { error, context });

export const trackPerformance = (action: string, duration: number) => 
  analytics.track('performance', { action, duration });