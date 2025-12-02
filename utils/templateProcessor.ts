import { Visit, Host, CongregationProfile } from '../types';

export interface TemplateVariables {
    speakerName?: string;
    speakerPhone?: string;
    hostName?: string;
    hostPhone?: string;
    hostAddress?: string;
    visitDate?: string;
    visitTime?: string;
    hospitalityOverseer?: string;
    hospitalityOverseerPhone?: string;
    firstTimeIntroduction?: string;
    visitList?: string;
}

/**
 * Process a template string by replacing variables with actual values
 */
export const processTemplate = (template: string, variables: TemplateVariables): string => {
    if (!template) return '';
    
    let processed = template;
    
    // Replace all known variables
    Object.entries(variables).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            processed = processed.replace(regex, String(value));
        }
    });
    
    // Clean up any remaining unreplaced variables by removing them
    processed = processed.replace(/\{[^}]+\}/g, '[Variable non définie]');
    
    return processed;
};

/**
 * Extract template variables from a visit and related data
 */
export const extractVisitVariables = (
    visit: Visit,
    host?: Host,
    congregationProfile?: CongregationProfile,
    isFirstTime?: boolean
): TemplateVariables => {
    const visitDate = new Date(visit.visitDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        speakerName: visit.nom,
        speakerPhone: visit.telephone || 'Non renseigné',
        hostName: host?.nom || visit.host,
        hostPhone: host?.telephone || 'Non renseigné',
        hostAddress: host?.address || 'Non renseignée',
        visitDate,
        visitTime: visit.visitTime,
        hospitalityOverseer: congregationProfile?.hospitalityOverseer || 'Responsable',
        hospitalityOverseerPhone: congregationProfile?.hospitalityOverseerPhone || 'Non renseigné',
        firstTimeIntroduction: isFirstTime ? '\n\nC\'est la première fois que nous nous contactons.' : ''
    };
};

/**
 * Generate a visit list for host request templates
 */
export const generateVisitList = (visits: Visit[]): string => {
    return visits.map((visit, index) => {
        const visitDate = new Date(visit.visitDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `${index + 1}. **${visit.nom}** (${visit.congregation})\n   📅 ${visitDate} à ${visit.visitTime}\n   📞 ${visit.telephone || 'Non renseigné'}`;
    }).join('\n\n');
};

/**
 * Validate template syntax and return any issues
 */
export const validateTemplate = (template: string): string[] => {
    const issues: string[] = [];
    
    // Check for unclosed braces
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
        issues.push('Accolades non équilibrées dans le modèle');
    }
    
    // Check for known variables
    const knownVariables = [
        'speakerName', 'speakerPhone', 'hostName', 'hostPhone', 'hostAddress',
        'visitDate', 'visitTime', 'hospitalityOverseer', 'hospitalityOverseerPhone',
        'firstTimeIntroduction', 'visitList'
    ];
    
    const variableMatches = template.match(/\{([^}]+)\}/g) || [];
    const unknownVariables = variableMatches
        .map(match => match.slice(1, -1))
        .filter(variable => !knownVariables.includes(variable));
    
    if (unknownVariables.length > 0) {
        issues.push(`Variables inconnues: ${unknownVariables.join(', ')}`);
    }
    
    return issues;
};

/**
 * Get available template variables with descriptions
 */
export const getAvailableVariables = (): Record<string, string> => {
    return {
        speakerName: 'Nom de l\'orateur',
        speakerPhone: 'Téléphone de l\'orateur',
        hostName: 'Nom du contact d\'accueil',
        hostPhone: 'Téléphone du contact d\'accueil',
        hostAddress: 'Adresse du contact d\'accueil',
        visitDate: 'Date de la visite (formatée)',
        visitTime: 'Heure de la visite',
        hospitalityOverseer: 'Nom du responsable de l\'accueil',
        hospitalityOverseerPhone: 'Téléphone du responsable de l\'accueil',
        firstTimeIntroduction: 'Introduction pour premier contact',
        visitList: 'Liste des visites (pour demandes groupées)'
    };
};