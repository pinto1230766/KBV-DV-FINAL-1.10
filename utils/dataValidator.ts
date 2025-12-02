import { Speaker, Host, Visit, CongregationProfile, PublicTalk, SpecialDate } from '../types';
import { generateUUID } from './uuid';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    repairedData?: any;
}

/**
 * Valide et répare les données importées
 */
export const validateAndRepairImportedData = (data: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let repairedData = { ...data };

    // Vérifications de base
    if (!data || typeof data !== 'object') {
        return { isValid: false, errors: ['Fichier invalide ou corrompu'], warnings: [] };
    }

    // Réparer les structures manquantes
    if (!repairedData.speakers) repairedData.speakers = [];
    if (!repairedData.hosts) repairedData.hosts = [];
    if (!repairedData.visits) repairedData.visits = [];
    if (!repairedData.archivedVisits) repairedData.archivedVisits = [];
    if (!repairedData.customTemplates) repairedData.customTemplates = {};
    if (!repairedData.customHostRequestTemplates) repairedData.customHostRequestTemplates = {};
    if (!repairedData.publicTalks) repairedData.publicTalks = [];
    if (!repairedData.savedViews) repairedData.savedViews = [];
    if (!repairedData.specialDates) repairedData.specialDates = [];
    if (!repairedData.speakerMessages) repairedData.speakerMessages = [];

    // Valider et réparer les orateurs
    const validSpeakers: Speaker[] = [];
    repairedData.speakers.forEach((speaker: any, index: number) => {
        if (!speaker.nom || typeof speaker.nom !== 'string') {
            warnings.push(`Orateur ${index + 1}: nom manquant ou invalide`);
            return;
        }
        
        const repairedSpeaker: Speaker = {
            id: speaker.id || generateUUID(),
            nom: speaker.nom.trim(),
            congregation: speaker.congregation || 'À définir',
            telephone: speaker.telephone || '',
            gender: speaker.gender || 'male',
            talkHistory: Array.isArray(speaker.talkHistory) ? speaker.talkHistory : [],
            notes: speaker.notes || undefined,
            photoUrl: speaker.photoUrl || undefined,
            tags: Array.isArray(speaker.tags) ? speaker.tags : [],
            isVehiculed: speaker.isVehiculed || false
        };
        
        validSpeakers.push(repairedSpeaker);
    });
    repairedData.speakers = validSpeakers;

    // Valider et réparer les contacts d'accueil
    const validHosts: Host[] = [];
    repairedData.hosts.forEach((host: any, index: number) => {
        if (!host.nom || typeof host.nom !== 'string') {
            warnings.push(`Contact ${index + 1}: nom manquant ou invalide`);
            return;
        }
        
        const repairedHost: Host = {
            nom: host.nom.trim(),
            telephone: host.telephone || '',
            gender: host.gender || 'male',
            address: host.address || '',
            notes: host.notes || undefined,
            unavailabilities: Array.isArray(host.unavailabilities) ? host.unavailabilities : [],
            tags: Array.isArray(host.tags) ? host.tags : []
        };
        
        validHosts.push(repairedHost);
    });
    repairedData.hosts = validHosts;

    // Valider et réparer les visites
    const validVisits: Visit[] = [];
    repairedData.visits.forEach((visit: any, index: number) => {
        if (!visit.nom || !visit.visitDate) {
            warnings.push(`Visite ${index + 1}: données essentielles manquantes`);
            return;
        }
        
        const repairedVisit: Visit = {
            id: visit.id || generateUUID(),
            nom: visit.nom,
            congregation: visit.congregation || 'À définir',
            telephone: visit.telephone || '',
            photoUrl: visit.photoUrl || undefined,
            visitId: visit.visitId || generateUUID(),
            visitDate: visit.visitDate,
            visitTime: visit.visitTime || '14:30',
            host: visit.host || 'À définir',
            accommodation: visit.accommodation || '',
            meals: visit.meals || '',
            status: visit.status || 'pending',
            notes: visit.notes || undefined,
            attachments: Array.isArray(visit.attachments) ? visit.attachments : [],
            expenses: Array.isArray(visit.expenses) ? visit.expenses : [],
            communicationStatus: visit.communicationStatus || {},
            checklist: Array.isArray(visit.checklist) ? visit.checklist : [],
            talkNoOrType: visit.talkNoOrType || undefined,
            talkTheme: visit.talkTheme || undefined,
            locationType: visit.locationType || 'physical',
            feedback: visit.feedback || undefined
        };
        
        validVisits.push(repairedVisit);
    });
    repairedData.visits = validVisits;

    // Réparer le profil de congrégation
    if (!repairedData.congregationProfile || typeof repairedData.congregationProfile !== 'object') {
        repairedData.congregationProfile = {
            name: "KBV DV LYON .FP",
            subtitle: "Gestion des Orateurs Visiteurs",
            defaultTime: "14:30",
            hospitalityOverseer: "",
            hospitalityOverseerPhone: "",
            backupPhoneNumber: "",
            latitude: null,
            longitude: null,
            city: ""
        };
        warnings.push('Profil de congrégation manquant, valeurs par défaut appliquées');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        repairedData
    };
};

/**
 * Crée une sauvegarde de sécurité avant import
 */
export const createBackupBeforeImport = (currentData: any): string => {
    const backup = {
        timestamp: new Date().toISOString(),
        data: currentData
    };
    
    const backupKey = `backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    // Nettoyer les anciennes sauvegardes (garder seulement les 5 dernières)
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    if (allKeys.length > 5) {
        allKeys.sort().slice(0, -5).forEach(key => {
            localStorage.removeItem(key);
        });
    }
    
    return backupKey;
};