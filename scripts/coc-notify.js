/**
 * COC Notification System - Push Notifications
 */

(function(global) {
    'use strict';

    const NOTIF_KEY = 'coc_notification_prefs';

    function loadPrefs() {
        try {
            return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
        } catch { return {}; }
    }

    function savePrefs(prefs) {
        try {
            localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
        } catch {}
    }

    function isSubscribed() {
        return loadPrefs().subscribed === true;
    }

    async function requestPermission() {
        if (!('Notification' in window)) {
            return { success: false, reason: 'unsupported' };
        }

        if (Notification.permission === 'granted') {
            return { success: true, permission: 'granted' };
        }

        if (Notification.permission === 'denied') {
            return { success: false, reason: 'denied' };
        }

        try {
            const result = await Notification.requestPermission();
            const granted = result === 'granted';

            const prefs = loadPrefs();
            prefs.subscribed = granted;
            prefs.lastAsked = new Date().toISOString();
            savePrefs(prefs);

            return { success: granted, permission: result };
        } catch (error) {
            return { success: false, reason: error.message };
        }
    }

    function showNotification(title, body, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            console.warn('Notifications not available or not granted');
            return false;
        }

        try {
            const notification = new Notification(title, {
                body: body,
                icon: options.icon || '/media/logo1.png',
                badge: options.badge || '/media/logo1.png',
                tag: options.tag || 'coc-general',
                vibrate: options.vibrate || [200, 100, 200],
                data: options.data || {},
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false
            });

            if (options.onClick) {
                notification.onclick = options.onClick;
            }

            return true;
        } catch (error) {
            console.error('Error showing notification:', error);
            return false;
        }
    }

    function showWelcomeNotification(name) {
        return showNotification(
            '🔥 Welcome to COC!',
            `${name}, we're excited to have you! Start your journey today.`,
            { tag: 'coc-welcome', icon: '/media/logo1.png' }
        );
    }

    function showDailyScripture() {
        const scripture = window.COCScripture ? window.COCScripture.getScriptureOfDay() : null;
        if (!scripture) return false;

        return showNotification(
            '📖 Scripture of the Day',
            `${scripture.verse} — ${scripture.reference}`,
            {
                tag: 'daily-scripture',
                data: { url: '/index.html#scripture' }
            }
        );
    }

    function showServiceReminder(day) {
        const services = {
            0: { title: 'Sunday Celebration Service', time: '8:00 AM - 10:30 AM' },
            1: { title: 'Healing & Deliverance Service', time: '5:00 PM' },
            3: { title: 'Power Communion Service', time: '5:30 PM' }
        };

        const service = services[day];
        if (!service) return false;

        return showNotification(
            `🙌 ${service.title}`,
            `Today at ${service.time}. Join us in person or online!`,
            {
                tag: 'service-reminder',
                data: { url: '/index.html#services' }
            }
        );
    }

    function showNewSermon(title, pastor) {
        return showNotification(
            '🎬 New Sermon Uploaded',
            `"${title}" by ${pastor} — Watch now!`,
            {
                tag: 'new-sermon',
                data: { url: '/sermons.html' }
            }
        );
    }

    function showEventReminder(eventTitle, eventDate) {
        return showNotification(
            '📅 Event Reminder',
            `${eventTitle} is coming up on ${eventDate}. Don't miss it!`,
            {
                tag: 'event-reminder',
                data: { url: '/index.html#events' }
            }
        );
    }

    function showChallengeWinner(name, challenge) {
        return showNotification(
            '🏆 Challenge Champion!',
            `${name} won the ${challenge} challenge!`,
            {
                tag: 'challenge-winner',
                data: { url: '/leaderboard.html' }
            }
        );
    }

    function showStreakMilestone(name, streak) {
        return showNotification(
            '🔥 Streak Milestone!',
            `${name} reached a ${streak}-day streak! Keep it up!`,
            {
                tag: 'streak-milestone',
                data: { url: '/index.html#community' }
            }
        );
    }

    function showPrayerAnswered(name, request) {
        return showNotification(
            '🙏 Prayer Answered!',
            `${name} shared that ${request} was answered!`,
            {
                tag: 'prayer-answered',
                data: { url: '/prayer.html' }
            }
        );
    }

    function showCommunityMilestone(type, name) {
        const messages = {
            new_leader: `🏆 ${name} is now #1 on the leaderboard!`,
            top_quiz: `🧠 ${name} scored highest on this week's quiz!`,
            top_streak: `🔥 ${name} has the longest active streak!`
        };

        const message = messages[type] || `${name} reached a community milestone!`;

        return showNotification(
            '🌟 Community Milestone',
            message,
            {
                tag: 'community-milestone',
                data: { url: '/community.html' }
            }
        );
    }

    // Register service worker
    async function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers not supported');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    async function setupNotifications() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return { success: false, reason: 'unsupported' };
        }

        const prefs = loadPrefs();

        // Don't ask if already asked within 7 days
        const lastAsked = prefs.lastAsked ? new Date(prefs.lastAsked) : null;
        const daysSinceAsked = lastAsked ? (Date.now() - lastAsked.getTime()) / 86400000 : 7;

        if (prefs.subscribed === false && daysSinceAsked < 7) {
            return { success: false, reason: 'already_asked' };
        }

        if (Notification.permission === 'granted') {
            prefs.subscribed = true;
            savePrefs(prefs);
            return { success: true, permission: 'granted' };
        }

        const result = await requestPermission();
        return result;
    }

    // Show notification subscription prompt
    function showSubscriptionPrompt(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const prefs = loadPrefs();
        const lastAsked = prefs.lastAsked ? new Date(prefs.lastAsked) : null;
        const daysSinceAsked = lastAsked ? (Date.now() - lastAsked.getTime()) / 86400000 : 7;

        // Don't show if already subscribed or if asked recently
        if (prefs.subscribed === true || (prefs.subscribed === false && daysSinceAsked < 7)) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #0a0a0a, #1a0505); border: 1px solid rgba(200,16,46,0.3); border-radius: 16px; padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(200,16,46,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">🔔</div>
                    <div>
                        <div style="color: #fff; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;">Get Daily Updates</div>
                        <div style="color: rgba(255,255,255,0.4); font-size: 12px;">Receive daily scriptures, service reminders &amp; church news</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.COCNotify.enableNotifications()" style="background: #c8102e; color: #fff; border: none; padding: 10px 24px; border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s;" onmouseover="this.style.background='#8b0000'" onmouseout="this.style.background='#c8102e'">
                        <i class="fas fa-bell"></i> Subscribe
                    </button>
                    <button onclick="window.COCNotify.dismissPrompt()" style="background: transparent; color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 10px 16px; border-radius: 100px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s;" onmouseover="this.style.color='rgba(255,255,255,0.6)'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
    }

    function enableNotifications() {
        const prefs = loadPrefs();
        prefs.subscribed = true;
        prefs.lastAsked = new Date().toISOString();
        savePrefs(prefs);

        requestPermission().then(result => {
            if (result.success) {
                showWelcomeNotification('Friend');
                const container = document.getElementById('notifPrompt');
                if (container) container.style.display = 'none';
            } else {
                alert('Please allow notifications in your browser settings to receive updates.');
            }
        });
    }

    function dismissPrompt() {
        const prefs = loadPrefs();
        prefs.subscribed = false;
        prefs.lastAsked = new Date().toISOString();
        savePrefs(prefs);
        const container = document.getElementById('notifPrompt');
        if (container) container.style.display = 'none';
    }

    // Schedule notifications (to be called from background or on page load)
    function scheduleDailyScripture() {
        const now = new Date();
        const target = new Date(now);
        target.setHours(6, 0, 0, 0);

        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        const delay = target.getTime() - now.getTime();

        setTimeout(() => {
            if (isSubscribed()) {
                showDailyScripture();
            }
            // Reschedule for next day
            scheduleDailyScripture();
        }, delay);
    }

    function scheduleServiceReminders() {
        const services = [
            { day: 0, hour: 7, minute: 30 }, // Sunday - 30 min before
            { day: 1, hour: 16, minute: 30 }, // Monday - 30 min before
            { day: 3, hour: 17, minute: 0 } // Wednesday - 30 min before
        ];

        const now = new Date();

        services.forEach(service => {
            const target = new Date(now);
            target.setHours(service.hour, service.minute, 0, 0);

            let diff = (service.day - now.getDay() + 7) % 7;
            if (diff === 0 && target <= now) {
                diff = 7;
            }
            target.setDate(target.getDate() + diff);

            const delay = target.getTime() - now.getTime();

            if (delay > 0) {
                setTimeout(() => {
                    if (isSubscribed()) {
                        showServiceReminder(service.day);
                    }
                }, delay);
            }
        });
    }

    global.COCNotify = {
        requestPermission,
        showNotification,
        showDailyScripture,
        showServiceReminder,
        showNewSermon,
        showEventReminder,
        showChallengeWinner,
        showStreakMilestone,
        showPrayerAnswered,
        showCommunityMilestone,
        registerServiceWorker,
        setupNotifications,
        showSubscriptionPrompt,
        enableNotifications,
        dismissPrompt,
        scheduleDailyScripture,
        scheduleServiceReminders,
        isSubscribed,
        loadPrefs,
        savePrefs
    };

})(window);