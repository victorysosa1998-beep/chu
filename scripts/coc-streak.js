/**
 * COC Streak System - Daily Streak Tracking
 * Handles: Daily visits, scripture reading, quiz completion streaks
 */

(function(global) {
    'use strict';

    const STREAK_KEY = 'coc_streak_data';
    const STREAK_TYPES = {
        visit: 'visit',
        scripture: 'scripture',
        quiz: 'quiz',
        reading_plan: 'reading_plan'
    };

    function defaultStreakData() {
        return {
            visit: { count: 0, longest: 0, lastDate: null, history: [] },
            scripture: { count: 0, longest: 0, lastDate: null, history: [] },
            quiz: { count: 0, longest: 0, lastDate: null, history: [] },
            reading_plan: { count: 0, longest: 0, lastDate: null, history: [] }
        };
    }

    function loadStreaks() {
        try {
            const raw = localStorage.getItem(STREAK_KEY);
            if (!raw) return defaultStreakData();
            const data = JSON.parse(raw);
            // Ensure all keys exist
            const defaults = defaultStreakData();
            for (const key in defaults) {
                if (!data[key]) data[key] = defaults[key];
            }
            return data;
        } catch { return defaultStreakData(); }
    }

    function saveStreaks(data) {
        try {
            localStorage.setItem(STREAK_KEY, JSON.stringify(data));
        } catch {}
    }

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function daysBetween(a, b) {
        return Math.floor((new Date(b) - new Date(a)) / 86400000);
    }

    function updateStreak(type) {
        const data = loadStreaks();
        const streak = data[type];
        if (!streak) return;

        const todayStr = today();
        const lastDate = streak.lastDate;

        if (lastDate === todayStr) {
            // Already counted today
            return { streak: streak.count, longest: streak.longest, newDay: false };
        }

        if (lastDate && daysBetween(lastDate, todayStr) === 1) {
            // Consecutive day
            streak.count += 1;
        } else if (!lastDate || daysBetween(lastDate, todayStr) > 1) {
            // Streak broken or first day
            streak.count = 1;
        }

        if (streak.count > streak.longest) {
            streak.longest = streak.count;
        }

        streak.lastDate = todayStr;

        // Add to history (keep last 30)
        if (!streak.history) streak.history = [];
        streak.history.push({ date: todayStr, count: streak.count });
        if (streak.history.length > 30) streak.history = streak.history.slice(-30);

        saveStreaks(data);

        // Check for streak milestones
        const milestones = [7, 14, 30, 60, 100, 365];
        if (milestones.includes(streak.count)) {
            window.dispatchEvent(new CustomEvent('coc:streak-milestone', {
                detail: { type, count: streak.count }
            }));
        }

        return { streak: streak.count, longest: streak.longest, newDay: true };
    }

    function getStreak(type) {
        const data = loadStreaks();
        return data[type] || { count: 0, longest: 0, lastDate: null, history: [] };
    }

    function getAllStreaks() {
        const data = loadStreaks();
        return {
            visit: data.visit,
            scripture: data.scripture,
            quiz: data.quiz,
            reading_plan: data.reading_plan
        };
    }

    function getTotalStreak() {
        const data = loadStreaks();
        // Use the lowest streak as the "total" (you must do all to maintain)
        return Math.min(
            data.visit.count || 0,
            data.scripture.count || 0,
            data.quiz.count || 0,
            data.reading_plan.count || 0
        );
    }

    function getLongestStreak() {
        const data = loadStreaks();
        return Math.max(
            data.visit.longest || 0,
            data.scripture.longest || 0,
            data.quiz.longest || 0,
            data.reading_plan.longest || 0
        );
    }

    function getStreakHistory(type, limit = 30) {
        const streak = getStreak(type);
        return streak.history || [];
    }

    function resetStreak(type) {
        const data = loadStreaks();
        if (data[type]) {
            data[type].count = 0;
            data[type].lastDate = null;
            saveStreaks(data);
        }
    }

    // Milestone notifications
    window.addEventListener('coc:streak-milestone', function(e) {
        const { type, count } = e.detail;
        const typeLabels = {
            visit: 'Daily Visit',
            scripture: 'Scripture Reading',
            quiz: 'Quiz Completion',
            reading_plan: 'Reading Plan'
        };

        if (window.COCNotify && window.COCNotify.isSubscribed()) {
            window.COCNotify.showStreakMilestone('You', count);
        }
    });

    global.COCStreak = {
        STREAK_TYPES,
        updateStreak,
        getStreak,
        getAllStreaks,
        getTotalStreak,
        getLongestStreak,
        getStreakHistory,
        resetStreak,
        loadStreaks,
        saveStreaks,
        defaultStreakData
    };

})(window);