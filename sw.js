const CACHE_NAME = 'bergwetter-shell-v2';
const DYNAMIC_CACHE_NAME = 'bergwetter-dynamic-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  
  // Pre-cache Meteocons
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/clear-day.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/clear-night.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/cloudy.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/fog.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/rain.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/snow.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/thunderstorms.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/hail.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/partly-cloudy-day.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/partly-cloudy-night.svg',
  'https://unpkg.com/@meteocons/svg@0.1.0/fill/wind.svg'
];

// Install Event - Pre-cache everything needed for offline shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First for APIs, Cache-First for static assets
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Check if it is an API request (Open-Meteo, LibreWXR, GeoSphere, Avalanche.report)
  const isApiRequest = 
    requestUrl.hostname.includes('open-meteo.com') ||
    requestUrl.hostname.includes('librewxr.net') ||
    requestUrl.hostname.includes('zamg.ac.at') ||
    requestUrl.hostname.includes('avalanche.report');
    
  if (isApiRequest) {
    // Network-First strategy: Fetch from network, fallback to cache, and update cache if successful
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] API offline fallback for:', event.request.url);
          return caches.match(event.request);
        })
    );
  } else {
    // Stale-While-Revalidate or Cache-First for static resources
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Trigger background fetch to update the cache (Stale-While-Revalidate)
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {/* Ignore network errors on revalidation */});
          
          return cachedResponse;
        }
        
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});
