/**
 * Utilitaires de sécurité pour l'application
 */

/**
 * Échappe une chaîne pour une utilisation sûre en HTML
 * @param unsafe - Chaîne non échappée
 * @returns Chaîne échappée
 */
export function escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Valide une adresse email
 * @param email - Adresse email à valider
 * @returns true si l'email est valide, false sinon
 */
export function isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Génère un jeton CSRF sécurisé
 * @returns Un jeton CSRF sécurisé
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    } else {
        // Fallback pour les environnements sans crypto
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Nettoie et valide une entrée utilisateur
 * @param input - Entrée utilisateur à nettoyer
 * @returns Entrée nettoyée et sécurisée
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Supprime les balises HTML/JS
    let sanitized = input.replace(/<[^>]*>?/gm, '');
    
    // Échappe les caractères spéciaux
    sanitized = escapeHtml(sanitized);
    
    // Limite la longueur (ajustez selon les besoins)
    return sanitized.substring(0, 1000);
}

/**
 * Vérifie si une chaîne contient du contenu potentiellement dangereux
 * @param input - Chaîne à vérifier
 * @returns true si la chaîne est suspecte, false sinon
 */
export function hasDangerousContent(input: string): boolean {
    if (!input) return false;
    
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Balises script
        /javascript:/gi, // Protocole javascript:
        /on\w+\s*=/gi, // Événements inline comme onclick=
        /\beval\s*\(/gi, // Appels à eval()
        /expression\s*\(/gi, // Propriétés d'expression CSS
        /url\s*\(/gi // Fonctions url() potentiellement dangereuses
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Hache une chaîne de manière sécurisée (pour les mots de passe)
 * @param str - Chaîne à hacher
 * @returns Promesse résolue avec le hachage
 */
export async function hashString(str: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback pour les environnements sans crypto.subtle
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

export default {
    escapeHtml,
    isValidEmail,
    generateCsrfToken,
    sanitizeInput,
    hasDangerousContent,
    hashString
};
