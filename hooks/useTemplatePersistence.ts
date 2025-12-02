import { useEffect, useCallback } from 'react';
import { CustomMessageTemplates, CustomHostRequestTemplates, Language } from '../types';

const TEMPLATES_STORAGE_KEY = 'customMessageTemplates';
const HOST_TEMPLATES_STORAGE_KEY = 'customHostRequestTemplates';

/**
 * Hook to handle template persistence with localStorage backup
 */
export const useTemplatePersistence = (
    customTemplates: CustomMessageTemplates,
    customHostRequestTemplates: CustomHostRequestTemplates
) => {
    // Backup templates to localStorage whenever they change
    useEffect(() => {
        try {
            if (Object.keys(customTemplates).length > 0) {
                localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
            }
        } catch (error) {
            console.error('Failed to backup message templates to localStorage:', error);
        }
    }, [customTemplates]);

    useEffect(() => {
        try {
            if (Object.keys(customHostRequestTemplates).length > 0) {
                localStorage.setItem(HOST_TEMPLATES_STORAGE_KEY, JSON.stringify(customHostRequestTemplates));
            }
        } catch (error) {
            console.error('Failed to backup host request templates to localStorage:', error);
        }
    }, [customHostRequestTemplates]);

    // Function to restore templates from localStorage if main storage fails
    const restoreFromBackup = useCallback((): {
        messageTemplates: CustomMessageTemplates;
        hostRequestTemplates: CustomHostRequestTemplates;
    } => {
        let messageTemplates: CustomMessageTemplates = {};
        let hostRequestTemplates: CustomHostRequestTemplates = {};

        try {
            const storedMessageTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
            if (storedMessageTemplates) {
                messageTemplates = JSON.parse(storedMessageTemplates);
            }
        } catch (error) {
            console.error('Failed to restore message templates from localStorage:', error);
        }

        try {
            const storedHostTemplates = localStorage.getItem(HOST_TEMPLATES_STORAGE_KEY);
            if (storedHostTemplates) {
                hostRequestTemplates = JSON.parse(storedHostTemplates);
            }
        } catch (error) {
            console.error('Failed to restore host request templates from localStorage:', error);
        }

        return { messageTemplates, hostRequestTemplates };
    }, []);

    // Function to clear backup storage
    const clearBackup = useCallback(() => {
        try {
            localStorage.removeItem(TEMPLATES_STORAGE_KEY);
            localStorage.removeItem(HOST_TEMPLATES_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear template backups:', error);
        }
    }, []);

    return {
        restoreFromBackup,
        clearBackup
    };
};

/**
 * Utility function to validate template structure
 */
export const validateTemplateStructure = (templates: any): boolean => {
    if (!templates || typeof templates !== 'object') return false;
    
    // Check if it follows the expected structure
    for (const [language, langTemplates] of Object.entries(templates)) {
        if (typeof langTemplates !== 'object') return false;
        
        for (const [messageType, typeTemplates] of Object.entries(langTemplates as any)) {
            if (typeof typeTemplates !== 'object') return false;
            
            for (const [role, template] of Object.entries(typeTemplates as any)) {
                if (typeof template !== 'string') return false;
            }
        }
    }
    
    return true;
};

/**
 * Utility function to validate host request template structure
 */
export const validateHostRequestTemplateStructure = (templates: any): boolean => {
    if (!templates || typeof templates !== 'object') return false;
    
    for (const [language, langTemplates] of Object.entries(templates)) {
        if (typeof langTemplates !== 'object') return false;
        
        for (const [type, template] of Object.entries(langTemplates as any)) {
            if (type !== 'singular' && type !== 'plural') return false;
            if (typeof template !== 'string') return false;
        }
    }
    
    return true;
};