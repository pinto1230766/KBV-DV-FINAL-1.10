// The name for the cache - IMPORTANT: Change this version number when you update the app's files.
const CACHE_NAME = 'gestion-visiteurs-tj-v45';

// List of files to cache for full offline functionality
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/utils/image.ts',
  '/utils/calendar.ts',
  '/utils/crypto.ts',
  '/utils/idb.ts',
  '/data/calendar_data.ts',
  '/components/UpcomingVisits.tsx',
  '/components/SpeakerList.tsx',
  '/components/ScheduleVisitModal.tsx',
  '/components/CalendarView.tsx',
  '/components/TimelineView.tsx',
  '/components/WeekView.tsx',
  '/components/MessagingCenter.tsx',
  '/components/SpeakerDetailsModal.tsx',
  '/components/Settings.tsx',
  '/components/MessageGeneratorModal.tsx',
  '/components/HostDetailsModal.tsx',
  '/components/GlobalSearchModal.tsx',
  '/components/ArchivedVisits.tsx',
  '/components/Dashboard.tsx',
  '/components/DashboardDonutChart.tsx',
  '/components/DashboardPrintLayout.tsx',
  '/components/TalksManager.tsx',
  '/components/TalkDetailsModal.tsx',
  '/components/EncryptionPrompt.tsx',
  '/components/PrintPreviewModal.tsx',
  '/components/Icons.tsx',
  '/components/Avatar.tsx',
  '/components/LanguageSelector.tsx',
  '/components/HostList.tsx',
  '/components/SpeakerSuggestionModal.tsx',
  '/components/NotificationPermissionBanner.tsx',
  '/components/PastVisitsManager.tsx',
  '/components/TabButton.tsx',
  '/components/TagInput.tsx',
  '/components/PlanningAssistant.tsx',
  '/components/HostRequestModal.tsx',
  '/components/DuplicateFinderModal.tsx',
  '/components/AssignTalkModal.tsx',
  '/components/FeedbackModal.tsx',
  '/contexts/ToastContext.tsx',
  '/contexts/ConfirmContext.tsx',
  '/contexts/DataContext.tsx',
  '/hooks/useLocalStorage.ts',
  '/hooks/useOnlineStatus.ts',
];

const EXTERNAL_URLS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@700;800&display=swap'
];


// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache app shell
        const appShellPromise = cache.addAll(APP_SHELL_URLS).catch(error => {
          console.error('Failed to cache app shell:', error);
        });
        // Separately cache external URLs, allowing them to fail without breaking install
        const externalPromise = Promise.all(
          EXTERNAL_URLS.map(url => 
            cache.add(new Request(url, { mode: 'no-cors' })).catch(err => console.warn(`Could not cache external URL: ${url}`, err))
          )
        );
        return Promise.all([appShellPromise, externalPromise]);
      })
  );
  self.skipWaiting();
});

// Activate event to clean up old caches and take control
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Liste des domaines autorisés pour prévenir SSRF
const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://fonts.googleapis.com',
  'https://cdn.tailwindcss.com'
];

// Fonction de validation d'URL renforcée
function isUrlAllowed(url) {
  try {
    const urlObj = new URL(url);
    // Bloquer les protocoles dangereux
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    // Bloquer les IPs privées et localhost
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return false;
    }
    return ALLOWED_ORIGINS.some(origin => urlObj.origin === origin);
  } catch {
    return false;
  }
}

// Fetch event with network-first strategy for app files
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Validation SSRF - bloquer les URLs non autorisées
  if (!isUrlAllowed(event.request.url)) {
    return;
  }

  // Use network-first for app's own resources to ensure freshness
  if (url.origin === self.location.origin && APP_SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed, fall back to cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // This should not happen for pre-cached resources, but as a fallback
            return new Response("You are offline and this resource isn't cached.", {
              status: 404,
              statusText: "Offline and not in cache"
            });
          });
      })
    );
  } else {
    // Use cache-first for external resources for performance
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          // Validation supplémentaire avant fetch
          if (!isUrlAllowed(event.request.url)) {
            return new Response('URL non autorisée', { 
              status: 403, 
              statusText: 'Forbidden' 
            });
          }
          return isUrlAllowed(event.request.url) ? fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }) : new Response('URL non autorisée', { status: 403 });
        })
    );
  }
});