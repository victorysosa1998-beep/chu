/**
 * COC Service Worker - Enhanced for Push Notifications
 * Deploy at: /sw.js
 */

const CACHE_NAME = 'coc-v2';
const OFFLINE_URLS = [
    '/',
    '/index.html',
    '/sermons.html',
    '/prayer.html',
    '/testimonies.html',
    '/branches.html',
    '/give.html',
    '/audio-sermons.html',
    '/media/logo1.png',
    '/media/logos.png'
];

// ── INSTALL ──
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(OFFLINE_URLS);
            })
            .catch(err => console.warn('Cache warning:', err))
    );
    self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// ── FETCH ──
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip analytics, tracking
    if (event.request.url.includes('google-analytics') ||
        event.request.url.includes('googletagmanager')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) {
                    // Refresh cache in background
                    fetch(event.request)
                        .then(response => {
                            if (response && response.status === 200) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, clone))
                                    .catch(() => {});
                            }
                        })
                        .catch(() => {});
                    return cached;
                }

                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, clone))
                                .catch(() => {});
                        }
                        return response;
                    })
                    .catch(() => {
                        return caches.match('/index.html');
                    });
            })
    );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', event => {
    let data = {
        title: 'City of Champion Fire',
        body: 'You have a new update from COC.',
        icon: '/media/logo1.png',
        badge: '/media/logo1.png',
        tag: 'coc-general',
        url: '/'
    };

    try {
        const parsed = event.data.json();
        data = { ...data, ...parsed };
    } catch {
        try {
            const text = event.data.text();
            data.body = text;
        } catch {}
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: { url: data.url },
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: [
            { action: 'open', title: '📖 Open' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clients => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            return clients.openWindow(url);
        })
    );
});

// ── BACKGROUND SYNC ──
self.addEventListener('periodicsync', event => {
    const tag = event.tag;

    if (tag === 'daily-scripture') {
        event.waitUntil(showDailyScriptureNotification());
    } else if (tag === 'service-reminder') {
        event.waitUntil(showServiceReminderNotification());
    }
});

async function showDailyScriptureNotification() {
    const scriptures = [
        { verse: 'Trust in the Lord with all your heart.', ref: 'Proverbs 3:5' },
        { verse: 'I can do all things through Christ.', ref: 'Philippians 4:13' },
        { verse: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
        { verse: 'Be strong and courageous.', ref: 'Joshua 1:9' },
        { verse: 'The Lord is my light and my salvation.', ref: 'Psalm 27:1' },
        { verse: 'Cast all your anxiety on him.', ref: '1 Peter 5:7' },
        { verse: 'Delight yourself in the Lord.', ref: 'Psalm 37:4' },
        { verse: 'No weapon forged against you will prevail.', ref: 'Isaiah 54:17' }
    ];

    const day = new Date().getDate();
    const index = day % scriptures.length;
    const scripture = scriptures[index];

    return self.registration.showNotification('📖 Scripture of the Day', {
        body: `${scripture.verse} — ${scripture.ref}`,
        icon: '/media/logo1.png',
        badge: '/media/logo1.png',
        tag: 'daily-scripture',
        data: { url: '/index.html#scripture' },
        vibrate: [200, 100, 200]
    });
}

async function showServiceReminderNotification() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    let title, body;

    if (day === 0 && hour < 10) {
        title = '🙌 Sunday Service Today';
        body = 'Celebration Service at 8:00 AM - 10:30 AM. Join us!';
    } else if (day === 1 && hour < 17) {
        title = '🔥 Healing & Deliverance';
        body = 'Today at 5:00 PM. Come as you are and experience God\'s healing power.';
    } else if (day === 3 && hour < 17) {
        title = '✝️ Power Communion Service';
        body = 'Today at 5:30 PM. A 30-minute encounter with God.';
    } else {
        return;
    }

    return self.registration.showNotification(title, {
        body: body,
        icon: '/media/logo1.png',
        badge: '/media/logo1.png',
        tag: 'service-reminder',
        data: { url: '/index.html#services' },
        vibrate: [200, 100, 200]
    });
}