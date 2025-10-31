// Configuration des optimisations de performance
export const PERFORMANCE_CONFIG = {
  // Cache
  CACHE_TTL: {
    SHORT: 30 * 1000,      // 30 secondes
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000,  // 30 minutes
  },

  // Virtualisation
  VIRTUALIZATION: {
    ITEM_HEIGHT: 60,        // Hauteur par défaut des items
    OVERSCAN: 5,           // Nombre d'items à pré-rendre
    THRESHOLD: 50,         // Seuil pour activer la virtualisation
  },

  // Debounce
  DEBOUNCE: {
    SEARCH: 300,           // ms pour les recherches
    RESIZE: 100,           // ms pour les redimensionnements
    SCROLL: 16,            // ms pour le scroll (60fps)
  },

  // Images
  IMAGES: {
    LAZY_LOADING_THRESHOLD: 100, // px avant le viewport
    PRELOAD_CRITICAL: true,      // Précharger les images critiques
    PLACEHOLDER_COLOR: '#f3f4f6', // Couleur du placeholder
  },

  // Mémoire
  MEMORY: {
    WARNING_THRESHOLD: 80,  // % d'utilisation pour alerte
    CLEANUP_INTERVAL: 5 * 60 * 1000, // Nettoyage toutes les 5 minutes
  },

  // Réseau
  NETWORK: {
    TIMEOUT: 10000,        // 10 secondes
    RETRY_ATTEMPTS: 3,     // Nombre de tentatives
    RETRY_DELAY: 1000,     // Délai entre tentatives
  },

  // Bundle
  BUNDLE: {
    CHUNK_SIZE_WARNING: 500 * 1024, // 500KB
    ENABLE_CODE_SPLITTING: true,
  }
};

// Détection des capacités de l'appareil
export function getDeviceCapabilities() {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    // Mémoire
    memory: (navigator as any).deviceMemory || 4, // GB, défaut 4GB
    
    // Processeur
    cores: navigator.hardwareConcurrency || 4,
    
    // Réseau
    connection: connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : null,
    
    // Écran
    screen: {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio || 1
    },
    
    // Support des fonctionnalités
    supports: {
      webp: checkWebPSupport(),
      intersectionObserver: 'IntersectionObserver' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      serviceWorker: 'serviceWorker' in navigator
    }
  };
}

function checkWebPSupport(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

// Configuration adaptative basée sur l'appareil
export function getAdaptiveConfig() {
  const capabilities = getDeviceCapabilities();
  const config = { ...PERFORMANCE_CONFIG };

  // Ajuster selon la mémoire disponible
  if (capabilities.memory <= 2) {
    // Appareil avec peu de mémoire
    config.CACHE_TTL.MEDIUM = 2 * 60 * 1000; // Réduire le cache
    config.VIRTUALIZATION.THRESHOLD = 20;     // Virtualiser plus tôt
    config.VIRTUALIZATION.OVERSCAN = 3;       // Moins de pré-rendu
  } else if (capabilities.memory >= 8) {
    // Appareil avec beaucoup de mémoire
    config.CACHE_TTL.LONG = 60 * 60 * 1000;   // Cache plus long
    config.VIRTUALIZATION.THRESHOLD = 100;    // Virtualiser plus tard
    config.VIRTUALIZATION.OVERSCAN = 10;      // Plus de pré-rendu
  }

  // Ajuster selon la connexion
  if (capabilities.connection?.saveData || capabilities.connection?.effectiveType === 'slow-2g') {
    config.IMAGES.PRELOAD_CRITICAL = false;   // Pas de préchargement
    config.CACHE_TTL.LONG = 60 * 60 * 1000;   // Cache plus long
  }

  // Ajuster selon le nombre de cœurs
  if (capabilities.cores <= 2) {
    config.DEBOUNCE.SEARCH = 500;             // Debounce plus long
    config.VIRTUALIZATION.THRESHOLD = 30;     // Virtualiser plus tôt
  }

  return config;
}

export default PERFORMANCE_CONFIG;