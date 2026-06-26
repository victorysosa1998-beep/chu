/**
 * COC User System - Anonymous User Management
 * Handles: User identity, streaks, points, badges, localStorage
 */

(function(global) {
    'use strict';

    const STORAGE_KEY = 'coc_user_data';
    const FEED_KEY = 'coc_activity_feed';
    const NOTIF_KEY = 'coc_notification_prefs';

    const FIREBASE_CFG = {
        apiKey: 'AIzaSyB2gU2QrpRnIevjhLqd1kTj-xsjiWBHGqQ',
        authDomain: 'joincoc.firebaseapp.com',
        projectId: 'joincoc',
        storageBucket: 'joincoc.firebasestorage.app',
        messagingSenderId: '322343274719',
        appId: '1:322343274719:web:689229a5dd1ca422c9c16a'
    };

    // Points configuration
    const POINTS = {
        daily_visit: 5,
        read_scripture: 10,
        quiz_complete: 20,
        quiz_perfect: 10,
        prayer_react: 5,
        testimony_submit: 25,
        sermon_view: 10,
        comment_post: 5,
        friend_invite: 50,   // Highest point action — invite earns most
        reading_plan_day: 15,
        challenge_join: 10,
        challenge_complete: 50
    };

    // Badge definitions
    const BADGES = [
        { id: 'faithful_visitor', label: '🏆 Faithful Visitor', desc: 'Visited 7 days in a row', check: u => u.streak >= 7 },
        { id: 'scripture_warrior', label: '📖 Scripture Warrior', desc: 'Read scripture 14 days in a row', check: u => u.streak >= 14 },
        { id: 'bible_scholar', label: '🎓 Bible Scholar', desc: 'Completed 10 quizzes', check: u => (u.quizzesCompleted || 0) >= 10 },
        { id: 'quiz_champion', label: '🧠 Quiz Champion', desc: 'Got perfect score 3x in a row', check: u => (u.perfectStreak || 0) >= 3 },
        { id: 'prayer_warrior', label: '🙏 Prayer Warrior', desc: 'Prayed for 20 requests', check: u => (u.prayers || 0) >= 20 },
        { id: 'community_builder', label: '🤝 Community Builder', desc: 'Posted 10 community items', check: u => (u.posts || 0) >= 10 },
        { id: 'encourager', label: '💛 Encourager', desc: 'Commented on 15 posts', check: u => (u.comments || 0) >= 15 },
        { id: 'centurion', label: '💯 Centurion', desc: 'Earned 100 points', check: u => u.points >= 100 },
        { id: 'champion', label: '🔥 Champion', desc: 'Earned 500 points', check: u => u.points >= 500 },
        { id: 'soul_winner', label: '🌟 Soul Winner', desc: 'Won 5 souls for Christ', check: u => (u.soulsWon || 0) >= 5 },
        { id: 'great_commission', label: '🕊️ Great Commission', desc: 'Invited 10+ people to church', check: u => (u.inviteCount || 0) >= 10 }
    ];

    function defaultUser() {
        return {
            id: 'coc_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
            displayName: null,
            role: 'Visitor',
            accountCreated: false,
            createdAt: new Date().toISOString(),
            points: 0,
            streak: 0,
            longestStreak: 0,
            lastActive: null,
            badges: [],
            newBadges: [],
            quizzesCompleted: 0,
            perfectStreak: 0,
            prayers: 0,
            posts: 0,
            comments: 0,
            sermonViews: 0,
            scriptureDays: [],
            promptsShown: [],
            privacy: 'public'
        };
    }

    function loadUser() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch { return null; }
    }

    function saveUser(user) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } catch {}
    }

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function daysBetween(a, b) {
        return Math.floor((new Date(b) - new Date(a)) / 86400000);
    }

    function pushFeed(item) {
        try {
            let feed = JSON.parse(localStorage.getItem(FEED_KEY) || '[]');
            feed.unshift({ ...item, id: 'feed_' + Date.now(), timestamp: Date.now() });
            if (feed.length > 50) feed.length = 50;
            localStorage.setItem(FEED_KEY, JSON.stringify(feed));
            window.dispatchEvent(new CustomEvent('coc:feed', { detail: item }));
        } catch {}
    }

    // Push an event to Firestore communityFeed so ALL users see it in real time
    function pushFirestoreFeed(payload) {
        try {
            Promise.all([
                import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
            ]).then(([{ initializeApp, getApps, getApp }, { getFirestore, collection, addDoc, serverTimestamp }]) => {
                const app = getApps().length ? getApp() : initializeApp(FIREBASE_CFG);
                const db  = getFirestore(app);
                addDoc(collection(db, 'communityFeed'), {
                    likes: 0,
                    commentCount: 0,
                    pinned: false,
                    pinnedBy: null,
                    ...payload,
                    createdAt: serverTimestamp()
                }).catch(() => {});
            }).catch(() => {});
        } catch {}
    }

    // Sync current user's score to Firestore leaderboard collection
    function syncLeaderboard(user) {
        if (!user || !user.displayName) return;
        try {
            Promise.all([
                import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
                import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
            ]).then(([{ initializeApp, getApps, getApp }, { getFirestore, doc, setDoc }]) => {
                const app = getApps().length ? getApp() : initializeApp(FIREBASE_CFG);
                const db  = getFirestore(app);
                setDoc(doc(db, 'leaderboard', user.id), {
                    name:      user.displayName,
                    points:    user.points || 0,
                    streak:    user.streak  || 0,
                    badges:    user.badges  ? user.badges.length : 0,
                    role:      user.role    || 'Visitor',
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(() => {});
            }).catch(() => {});
        } catch {}
    }

    const COCUser = {
        POINTS,
        BADGES,

        getUser: loadUser,
        saveUser: saveUser,

        createUser(displayName, role = 'Visitor') {
            const user = defaultUser();
            user.displayName = displayName.trim() || 'Friend';
            user.role = role;
            saveUser(user);

            // Local feed (for this device's widget)
            pushFeed({ type: 'join', name: user.displayName });

            // ✅ FIX: Push join event to Firestore so every user sees it
            pushFirestoreFeed({
                type: 'join',
                name: user.displayName,
                content: `${user.displayName} just joined the COC family! 🎉`,
                creatorId: user.id
            });

            return user;
        },

        recordVisit() {
            let user = loadUser();
            if (!user) return null;

            const todayStr = today();
            const wasToday = user.lastActive === todayStr;

            if (!wasToday) {
                const last = user.lastActive;
                if (last && daysBetween(last, todayStr) === 1) {
                    user.streak += 1;
                } else if (!last || daysBetween(last, todayStr) > 1) {
                    user.streak = 1;
                }
                user.longestStreak = Math.max(user.longestStreak, user.streak);
                user.lastActive = todayStr;
                user.points += POINTS.daily_visit;

                // Check for new badges
                const newBadges = this.checkBadges(user);
                if (newBadges.length > 0) {
                    pushFeed({ type: 'badge', name: user.displayName, badge: newBadges[0].label });
                    // ✅ Also push badge earn to Firestore
                    pushFirestoreFeed({
                        type: 'badge',
                        name: user.displayName,
                        content: `${user.displayName} earned the ${newBadges[0].label} badge!`,
                        badge: newBadges[0].label,
                        creatorId: user.id
                    });
                }

                saveUser(user);
                syncLeaderboard(user);
            }
            return user;
        },

        recordScriptureRead() {
            let user = loadUser();
            if (!user) return;

            const todayStr = today();
            if (!user.scriptureDays.includes(todayStr)) {
                user.scriptureDays.push(todayStr);
                user.points += POINTS.read_scripture;
                this.checkBadges(user);
                saveUser(user);
                syncLeaderboard(user);

                // Local feed
                pushFeed({ type: 'scripture', name: user.displayName });

                // ✅ Also push to Firestore
                pushFirestoreFeed({
                    type: 'scripture',
                    name: user.displayName,
                    content: `${user.displayName} read today's scripture 📖`,
                    creatorId: user.id
                });
            }
        },

        recordQuiz(perfect = false) {
            let user = loadUser();
            if (!user) return;

            user.quizzesCompleted = (user.quizzesCompleted || 0) + 1;
            user.points += POINTS.quiz_complete;

            if (perfect) {
                user.perfectStreak = (user.perfectStreak || 0) + 1;
                user.points += POINTS.quiz_perfect;
                pushFeed({ type: 'quiz_perfect', name: user.displayName });
                pushFirestoreFeed({
                    type: 'quiz_perfect',
                    name: user.displayName,
                    content: `${user.displayName} scored 100% on today's quiz! 🧠`,
                    creatorId: user.id
                });
            } else {
                user.perfectStreak = 0;
            }

            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);
        },

        recordPrayer() {
            let user = loadUser();
            if (!user) return;
            user.prayers = (user.prayers || 0) + 1;
            user.points += POINTS.prayer_react;
            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);
        },

        recordTestimony() {
            let user = loadUser();
            if (!user) return;
            user.points += POINTS.testimony_submit;
            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);

            pushFeed({ type: 'testimony', name: user.displayName });
            pushFirestoreFeed({
                type: 'testimony',
                name: user.displayName,
                content: `${user.displayName} shared a testimony ✨`,
                creatorId: user.id
            });
        },

        recordSermonView() {
            let user = loadUser();
            if (!user) return;
            user.sermonViews = (user.sermonViews || 0) + 1;
            user.points += POINTS.sermon_view;
            saveUser(user);
        },

        recordComment() {
            let user = loadUser();
            if (!user) return;
            user.comments = (user.comments || 0) + 1;
            user.points += POINTS.comment_post;
            this.checkBadges(user);
            saveUser(user);
        },

        recordPost() {
            let user = loadUser();
            if (!user) return;
            user.posts = (user.posts || 0) + 1;
            user.points += POINTS.comment_post;
            this.checkBadges(user);
            saveUser(user);
        },

        recordInvite() {
            let user = loadUser();
            if (!user) return;
            user.inviteCount = (user.inviteCount || 0) + 1;
            user.points += POINTS.friend_invite; // highest-value action
            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);
            return user;
        },

        recordSoulWon() {
            let user = loadUser();
            if (!user) return;
            user.soulsWon = (user.soulsWon || 0) + 1;
            user.points += POINTS.friend_invite;
            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);
            return user;
        },

        // When someone taps "like" on your shared streak/invite link
        recordStreakLike(likerId) {
            let user = loadUser();
            if (!user) return;
            if (!user.inviteStreakLikes) user.inviteStreakLikes = [];
            if (user.inviteStreakLikes.includes(likerId)) return; // no double counting
            user.inviteStreakLikes.push(likerId);
            user.points += POINTS.friend_invite; // confirmed invite = highest points
            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);
            return user;
        },

        recordChallengeComplete() {
            let user = loadUser();
            if (!user) return;
            user.points += POINTS.challenge_complete;
            this.checkBadges(user);
            saveUser(user);
            syncLeaderboard(user);
        },

        checkBadges(user) {
            const earned = [];
            BADGES.forEach(badge => {
                if (!user.badges.includes(badge.id) && badge.check(user)) {
                    user.badges.push(badge.id);
                    user.newBadges.push(badge.id);
                    earned.push(badge);
                }
            });
            return earned;
        },

        getBadgeInfo(id) {
            return BADGES.find(b => b.id === id) || { label: id, desc: '' };
        },

        shouldPromptAccount() {
            const user = loadUser();
            if (!user || user.accountCreated) return false;
            const prompts = [
                { key: 'streak_7', check: u => u.streak >= 7 },
                { key: 'pts_100', check: u => u.points >= 100 },
                { key: 'badge_1', check: u => u.badges.length >= 1 },
                { key: 'quiz_5', check: u => (u.quizzesCompleted || 0) >= 5 }
            ];
            return prompts.some(p => !user.promptsShown.includes(p.key) && p.check(user));
        },

        markPromptShown(key) {
            let user = loadUser();
            if (!user) return;
            if (!user.promptsShown.includes(key)) {
                user.promptsShown.push(key);
                saveUser(user);
            }
        },

        getFeed: function() {
            try {
                return JSON.parse(localStorage.getItem(FEED_KEY) || '[]');
            } catch { return []; }
        },

        formatFeedItem(item) {
            const name = item.name || 'Someone';
            switch (item.type) {
                case 'join': return `🎉 <strong>${name}</strong> joined the COC family`;
                case 'badge': return `🏆 <strong>${name}</strong> earned <strong>${item.badge}</strong>`;
                case 'quiz_perfect': return `🧠 <strong>${name}</strong> scored 100% on today's quiz!`;
                case 'testimony': return `✨ <strong>${name}</strong> shared a testimony`;
                case 'scripture': return `📖 <strong>${name}</strong> read today's scripture`;
                case 'streak': return `🔥 <strong>${name}</strong> reached a ${item.streak}-day streak`;
                default: return `<strong>${name}</strong> was active`;
            }
        },

        timeAgo(timestamp) {
            const diff = Date.now() - timestamp;
            if (diff < 60000) return 'just now';
            if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
            if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
            return Math.floor(diff / 86400000) + 'd ago';
        },

        getLeaderboard() {
            const user = loadUser();
            if (!user || !user.displayName) return [];
            return [{
                name: user.displayName,
                points: user.points,
                streak: user.streak,
                badges: user.badges.length,
                role: user.role
            }];
        },

        getPointsTable: () => POINTS,
        getAllBadges: () => BADGES
    };

    global.COCUser = COCUser;

})(window);