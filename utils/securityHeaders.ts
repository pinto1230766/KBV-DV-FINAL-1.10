/**
 * Configuration des en-têtes de sécurité HTTP
 */

/**
 * Configuration des en-têtes de sécurité pour Express
 */
export const securityHeaders = {
    // Protège contre les attaques XSS
    'X-XSS-Protection': '1; mode=block',
    
    // Empêche le navigateur de détecter automatiquement le type MIME
    'X-Content-Type-Options': 'nosniff',
    
    // Contrôle la politique de référent
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Politique de sécurité du contenu
    'Content-Security-Policy': [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
        "style-src 'self' 'unsafe-inline';",
        "img-src 'self' data: https:;",
        "font-src 'self';",
        "connect-src 'self' https://api.votredomaine.com;",
        "frame-ancestors 'none';",
        "form-action 'self';",
        "base-uri 'self';"
    ].join(' '),
    
    // Politique de fonctionnalités
    'Feature-Policy': [
        "geolocation 'none';",
        "microphone 'none';",
        "camera 'none';"
    ].join(' '),
    
    // Politique des permissions
    'Permissions-Policy': [
        'geolocation=(),',
        'microphone=(),',
        'camera=(),',
        'payment=()'
    ].join('')
};

/**
 * Configuration CORS sécurisée
 */
export const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 heures
};

/**
 * Configuration du taux de limitation des requêtes
 */
export const rateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes par défaut
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
};

/**
 * Configuration HSTS (Strict-Transport-Security)
 */
export const hstsConfig = {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
};

/**
 * Liste des en-têtes de sécurité recommandés
 */
export const recommendedSecurityHeaders = {
    ...securityHeaders,
    'Strict-Transport-Security': `max-age=${hstsConfig.maxAge}${hstsConfig.includeSubDomains ? '; includeSubDomains' : ''}${hstsConfig.preload ? '; preload' : ''}`,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'off',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Expect-CT': 'enforce, max-age=86400'
};

/**
 * Vérifie si les en-têtes de sécurité sont correctement configurés
 * @param headers - Les en-têtes à vérifier
 * @returns Un objet avec les en-têtes manquants et les recommandations
 */
export function checkSecurityHeaders(headers: Record<string, string | string[] | undefined>) {
    const requiredHeaders = Object.keys(recommendedSecurityHeaders);
    const missingHeaders: string[] = [];
    const recommendations: string[] = [];
    
    requiredHeaders.forEach(header => {
        if (!(header.toLowerCase() in Object.keys(headers).map(h => h.toLowerCase()))) {
            missingHeaders.push(header);
            recommendations.push(`Ajoutez l'en-tête ${header}: ${recommendedSecurityHeaders[header as keyof typeof recommendedSecurityHeaders]}`);
        }
    });
    
    return {
        isSecure: missingHeaders.length === 0,
        missingHeaders,
        recommendations
    };
}

export default {
    securityHeaders,
    corsOptions,
    rateLimitConfig,
    hstsConfig,
    recommendedSecurityHeaders,
    checkSecurityHeaders
};
