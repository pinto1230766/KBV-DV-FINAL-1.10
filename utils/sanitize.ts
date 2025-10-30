/**
 * Utilitaires de sanitisation pour prévenir les attaques XSS et d'injection
 */

/**
 * Sanitise une chaîne HTML en échappant les caractères dangereux
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[<>\"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return entities[match] || match;
  });
}

/**
 * Sanitise une entrée pour les logs en supprimant les caractères de contrôle
 */
export function sanitizeForLog(input: any): string {
  if (typeof input !== 'string') {
    input = String(input);
  }
  
  return input
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 1000); // Limiter la longueur
}

/**
 * Sanitise une URL pour prévenir les attaques
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  
  try {
    const parsedUrl = new URL(url);
    // Autoriser seulement HTTPS et data: URLs
    if (!['https:', 'data:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
}

/**
 * Sanitise un nom de fichier
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return 'fichier';
  
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}