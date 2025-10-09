/**
 * Génère un UUID v4 compatible avec tous les environnements
 * Utilise crypto.randomUUID() si disponible, sinon utilise un fallback
 */
export function generateUUID(): string {
  // Vérifier si crypto.randomUUID est disponible
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback pour les environnements qui ne supportent pas crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Génère un ID court pour les éléments qui n'ont pas besoin d'un UUID complet
 */
export function generateShortId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
