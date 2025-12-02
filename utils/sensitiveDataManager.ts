import { encrypt, decrypt } from './crypto';

// Types de données sensibles
export type SensitiveDataType = 'phone' | 'address' | 'email' | 'notes';

// Configuration du chiffrement des données sensibles
const SENSITIVE_DATA_KEY = 'sensitiveDataEncryption';
const ENCRYPTION_PASSWORD = 'kbv-sensitive-data-2024'; // En production, utiliser une clé plus sécurisée

interface SensitiveDataSettings {
    encryptPhones: boolean;
    encryptAddresses: boolean;
    encryptNotes: boolean;
    encryptEmails: boolean;
}

/**
 * Gestionnaire pour les données sensibles
 */
export class SensitiveDataManager {
    private settings: SensitiveDataSettings;

    constructor() {
        this.settings = this.loadSettings();
    }

    private loadSettings(): SensitiveDataSettings {
        try {
            const stored = localStorage.getItem('securitySettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    encryptPhones: parsed.encryptSensitiveData || false,
                    encryptAddresses: parsed.encryptSensitiveData || false,
                    encryptNotes: parsed.encryptSensitiveData || false,
                    encryptEmails: parsed.encryptSensitiveData || false
                };
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres de chiffrement:', error);
        }
        
        return {
            encryptPhones: false,
            encryptAddresses: false,
            encryptNotes: false,
            encryptEmails: false
        };
    }

    /**
     * Chiffre une donnée sensible si nécessaire
     */
    async encryptIfNeeded(data: string, type: SensitiveDataType): Promise<string> {
        if (!data || !this.shouldEncrypt(type)) {
            return data;
        }

        try {
            // Marquer comme chiffré avec un préfixe
            const encrypted = await encrypt({ value: data }, ENCRYPTION_PASSWORD);
            return `ENC:${encrypted}`;
        } catch (error) {
            console.error('Erreur lors du chiffrement:', error);
            return data; // Retourner la donnée non chiffrée en cas d'erreur
        }
    }

    /**
     * Déchiffre une donnée si elle est chiffrée
     */
    async decryptIfNeeded(data: string): Promise<string> {
        if (!data || !data.startsWith('ENC:')) {
            return data;
        }

        try {
            const encryptedData = data.substring(4); // Enlever le préfixe "ENC:"
            const decrypted = await decrypt<{ value: string }>(encryptedData, ENCRYPTION_PASSWORD);
            return decrypted.value;
        } catch (error) {
            console.error('Erreur lors du déchiffrement:', error);
            return data; // Retourner la donnée telle quelle en cas d'erreur
        }
    }

    /**
     * Masque une donnée pour l'affichage
     */
    maskForDisplay(data: string, type: SensitiveDataType): string {
        const securitySettings = this.loadDisplaySettings();
        
        switch (type) {
            case 'phone':
                if (securitySettings.hidePhoneNumbers && data.length > 4) {
                    return data.replace(/\d/g, '*').slice(0, -4) + data.slice(-4);
                }
                break;
            case 'address':
                if (securitySettings.hideAddresses) {
                    return data.replace(/\d+/g, '***');
                }
                break;
            case 'email':
                if (securitySettings.hideEmails) {
                    const [local, domain] = data.split('@');
                    if (local && domain) {
                        const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
                        return `${maskedLocal}@${domain}`;
                    }
                }
                break;
        }
        
        return data;
    }

    private shouldEncrypt(type: SensitiveDataType): boolean {
        switch (type) {
            case 'phone': return this.settings.encryptPhones;
            case 'address': return this.settings.encryptAddresses;
            case 'notes': return this.settings.encryptNotes;
            case 'email': return this.settings.encryptEmails;
            default: return false;
        }
    }

    private loadDisplaySettings() {
        try {
            const stored = localStorage.getItem('securitySettings');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres d\'affichage:', error);
        }
        
        return {
            hidePhoneNumbers: false,
            hideAddresses: false,
            hideEmails: false
        };
    }

    /**
     * Met à jour les paramètres de chiffrement
     */
    updateSettings(newSettings: Partial<SensitiveDataSettings>) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Traite un objet entier pour chiffrer/déchiffrer les données sensibles
     */
    async processObject(obj: any, operation: 'encrypt' | 'decrypt'): Promise<any> {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        const processed = { ...obj };

        // Traiter les champs connus
        if (processed.telephone) {
            processed.telephone = operation === 'encrypt' 
                ? await this.encryptIfNeeded(processed.telephone, 'phone')
                : await this.decryptIfNeeded(processed.telephone);
        }

        if (processed.address) {
            processed.address = operation === 'encrypt'
                ? await this.encryptIfNeeded(processed.address, 'address')
                : await this.decryptIfNeeded(processed.address);
        }

        if (processed.notes) {
            processed.notes = operation === 'encrypt'
                ? await this.encryptIfNeeded(processed.notes, 'notes')
                : await this.decryptIfNeeded(processed.notes);
        }

        return processed;
    }
}

// Instance globale
export const sensitiveDataManager = new SensitiveDataManager();