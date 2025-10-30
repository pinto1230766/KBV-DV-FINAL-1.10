/**
 * Utilitaires de sanitisation pour prévenir les attaques XSS
 */

// Fonction simple de sanitisation sans dépendance externe
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitisation pour les URLs
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Autoriser seulement les protocoles sûrs
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  
  try {
    const urlObj = new URL(url);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

// Sanitisation pour les noms de fichiers
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\.\./g, '')
    .trim();
};

// Validation et sanitisation des données utilisateur
export const sanitizeUserInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  return sanitizeHtml(input.slice(0, maxLength).trim());
};