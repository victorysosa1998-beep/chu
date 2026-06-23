/**
 * COC Points System - Points & Rewards
 * Handles: Point earning, spending, leaderboard, achievements
 */

(function(global) {
    'use strict';

    const POINTS_KEY = 'coc_points_data';
    const LEADERBOARD_KEY = 'coc_leaderboard';

    const POINTS_CONFIG = {
        daily_visit: 5,
        read_scripture: 10,
        quiz_complete: 20,
        quiz_perfect: 10,
        prayer_react: 5,
        testimony_submit: 25,
        sermon_view: 10,
        comment_post: 5,
        friend_invite: 30,
        reading_plan_day: 15,
        challenge_join: 10,
        challenge_complete: 50,
        share_feed: 5,
        community_post: 10,
        event_attend: 20
    };

    const REWARDS = [
        { id: 'free_coffee', label: '☕ Free Coffee', cost: 50 },
        { id: 'book_discount', label: '📖 Book Discount 10%', cost: 100 },
        { id: 'reserved_seat', label: '💺 Reserved Seat', cost: 200 },
        { id: 'book_gift', label: '📚 Gift Book', cost: 300 },
        { id: 'event_pass', label: '🎫 Event Pass', cost: 500 },
        { id: 'dinner_with_pastor', label: '🍽️ Dinner with Pastor', cost: 1000 }
    ];

    function defaultPointsData() {
        return {
            total: 0,
            available: 0,
            spent: 0,
            history: [],
            earnedByType: {},
            redeemed: []
        };
    }

    function loadPoints() {
        try {
            const raw = localStorage.getItem(POINTS_KEY);
            if (!raw) return defaultPointsData();
            const data = JSON.parse(raw);
            // Ensure all keys exist
            const defaults = defaultPointsData();
            for (const key in defaults) {
                if (!data[key]) data[key] = defaults[key];
            }
            return data;
        } catch { return defaultPointsData(); }
    }

    function savePoints(data) {
        try {
            localStorage.setItem(POINTS_KEY, JSON.stringify(data));
        } catch {}
    }

    function earnPoints(action, metadata = {}) {
        const points = POINTS_CONFIG[action] || 0;
        if (points === 0) return { success: false, points: 0 };

        const data = loadPoints();
        data.total += points;
        data.available += points;

        if (!data.earnedByType[action]) data.earnedByType[action] = 0;
        data.earnedByType[action] += points;

        data.history.push({
            type: 'earn',
            action: action,
            points: points,
            date: new Date().toISOString(),
            metadata: metadata
        });

        // Keep last 100 entries
        if (data.history.length > 100) data.history = data.history.slice(-100);

        savePoints(data);

        // Update leaderboard
        updateLeaderboard(points);

        // Check for level-up (every 100 points)
        const levels = [100, 250, 500, 1000, 2500, 5000];
        if (levels.includes(data.total) || levels.includes(data.total - points)) {
            window.dispatchEvent(new CustomEvent('coc:level-up', {
                detail: { total: data.total, level: getLevel(data.total) }
            }));
        }

        return { success: true, points, total: data.total, available: data.available };
    }

    function spendPoints(cost, rewardId) {
        const data = loadPoints();
        if (data.available < cost) {
            return { success: false, reason: 'Insufficient points' };
        }

        data.available -= cost;
        data.spent += cost;
        data.redeemed.push({
            rewardId: rewardId,
            cost: cost,
            date: new Date().toISOString()
        });

        data.history.push({
            type: 'spend',
            action: 'redeem_' + rewardId,
            points: -cost,
            date: new Date().toISOString()
        });

        savePoints(data);
        return { success: true, available: data.available };
    }

    function getPoints() {
        const data = loadPoints();
        return {
            total: data.total,
            available: data.available,
            spent: data.spent
        };
    }

    function getPointsHistory(limit = 50) {
        const data = loadPoints();
        return data.history.slice(0, limit);
    }

    function getLevel(points) {
        const levels = [
            { min: 0, label: '🌟 New Believer', icon: '🌟' },
            { min: 100, label: '🔥 Disciple', icon: '🔥' },
            { min: 250, label: '⚡ Warrior', icon: '⚡' },
            { min: 500, label: '💪 Champion', icon: '💪' },
            { min: 1000, label: '👑 Overcomer', icon: '👑' },
            { min: 2500, label: '✨ Apostle', icon: '✨' },
            { min: 5000, label: '🔥🔥🔥 Living Legend', icon: '🔥' }
        ];

        let level = levels[0];
        for (const l of levels) {
            if (points >= l.min) level = l;
        }
        return level;
    }

    function getNextLevel(points) {
        const levels = [
            { min: 0, label: '🌟 New Believer' },
            { min: 100, label: '🔥 Disciple' },
            { min: 250, label: '⚡ Warrior' },
            { min: 500, label: '💪 Champion' },
            { min: 1000, label: '👑 Overcomer' },
            { min: 2500, label: '✨ Apostle' },
            { min: 5000, label: '🔥🔥🔥 Living Legend' }
        ];

        for (const l of levels) {
            if (points < l.min) {
                return { next: l, needed: l.min - points };
            }
        }
        return null;
    }

    function getEarnedByType() {
        const data = loadPoints();
        return data.earnedByType || {};
    }

    function getRedeemed() {
        const data = loadPoints();
        return data.redeemed || [];
    }

    function getRewards() {
        return REWARDS;
    }

    function getReward(id) {
        return REWARDS.find(r => r.id === id);
    }

    // Leaderboard functions (local)
    function updateLeaderboard(points) {
        try {
            let board = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
            const user = window.COCUser ? window.COCUser.getUser() : null;
            if (!user || !user.displayName) return;

            const entry = board.find(e => e.id === user.id);
            if (entry) {
                entry.points += points;
                entry.lastActive = new Date().toISOString();
            } else {
                board.push({
                    id: user.id,
                    name: user.displayName,
                    points: points,
                    badges: user.badges ? user.badges.length : 0,
                    streak: user.streak || 0,
                    role: user.role || 'Visitor',
                    lastActive: new Date().toISOString()
                });
            }

            // Sort by points descending
            board.sort((a, b) => b.points - a.points);
            localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
        } catch {}
    }

    function getLeaderboard(limit = 20) {
        try {
            const board = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
            return board.slice(0, limit);
        } catch { return []; }
    }

    function getRank(userId) {
        const board = getLeaderboard(100);
        const index = board.findIndex(e => e.id === userId);
        return index === -1 ? null : index + 1;
    }

    // Level-up notifications
    window.addEventListener('coc:level-up', function(e) {
        const { total, level } = e.detail;
        if (window.COCNotify && window.COCNotify.isSubscribed()) {
            window.COCNotify.showNotification(
                '🎉 Level Up!',
                `You reached ${level.label} with ${total} points!`,
                { tag: 'level-up', icon: '/media/logo1.png' }
            );
        }
    });

    global.COCPoints = {
        POINTS_CONFIG,
        REWARDS,
        earnPoints,
        spendPoints,
        getPoints,
        getPointsHistory,
        getLevel,
        getNextLevel,
        getEarnedByType,
        getRedeemed,
        getRewards,
        getReward,
        getLeaderboard,
        getRank,
        updateLeaderboard,
        loadPoints,
        savePoints
    };

})(window);