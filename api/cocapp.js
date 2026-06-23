/**
 * COC App — Shared engagement engine
 * Handles: anonymous user identity, streaks, points, badges, storage
 * No mandatory login — uses localStorage keyed by generated visitor ID
 */

(function (global) {
  'use strict';

  /* ────────────────────────────────────────────
     CONSTANTS
  ──────────────────────────────────────────── */
  const STORAGE_KEY   = 'coc_user_v1';
  const FEED_KEY      = 'coc_feed_v1';
  const NOTIF_KEY     = 'coc_notif_prefs_v1';
  const POINTS_TABLE  = {
    daily_visit:        5,
    read_scripture:    10,
    quiz_complete:     20,
    quiz_perfect:      10,   // bonus on top of complete
    prayer_react:       5,
    testimony_submit:  25,
    sermon_view:       10,
    comment_post:       5,
    friend_invite:     30,
    reading_plan_day:  15,
    challenge_join:    10,
    challenge_complete:50,
  };

  const BADGES = [
    { id: 'faithful_visitor',   label: '🏆 Faithful Visitor',   desc: 'Visited 7 days in a row',          check: u => u.currentStreak >= 7 },
    { id: 'scripture_warrior',  label: '📖 Scripture Warrior',  desc: 'Read scripture 14 days in a row',  check: u => u.currentStreak >= 14 },
    { id: 'bible_scholar',      label: '🎓 Bible Scholar',      desc: 'Completed 10 quizzes',             check: u => (u.quizzesCompleted || 0) >= 10 },
    { id: 'quiz_champion',      label: '🧠 Quiz Champion',      desc: 'Got a perfect score 3× in a row',  check: u => (u.perfectQuizStreak || 0) >= 3 },
    { id: 'prayer_warrior',     label: '🙏 Prayer Warrior',     desc: 'Prayed for 20 requests',           check: u => (u.prayerReactions || 0) >= 20 },
    { id: 'community_builder',  label: '🤝 Community Builder',  desc: 'Posted 10 community items',        check: u => (u.postCount || 0) >= 10 },
    { id: 'encourager',         label: '💛 Encourager',         desc: 'Commented on 15 posts',            check: u => (u.commentCount || 0) >= 15 },
    { id: 'centurion',          label: '💯 Centurion',          desc: 'Earned 100 points',                check: u => u.points >= 100 },
    { id: 'champion',           label: '🔥 Champion',           desc: 'Earned 500 points',                check: u => u.points >= 500 },
  ];

  const ACCOUNT_PROMPTS = [
    { key: 'streak_7',  check: u => u.currentStreak >= 7  && !u.accountCreated },
    { key: 'pts_100',   check: u => u.points >= 100       && !u.accountCreated },
    { key: 'quiz_5',    check: u => (u.quizzesCompleted||0) >= 5 && !u.accountCreated },
    { key: 'badge_1',   check: u => u.badges.length >= 1  && !u.accountCreated },
  ];

  /* ────────────────────────────────────────────
     UTILITY
  ──────────────────────────────────────────── */
  function uid() {
    return 'coc_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysBetween(a, b) {
    return Math.floor((new Date(b) - new Date(a)) / 86400000);
  }

  /* ────────────────────────────────────────────
     USER LOAD / SAVE
  ──────────────────────────────────────────── */
  function defaultUser() {
    return {
      id:                uid(),
      displayName:       null,
      role:              'Visitor',
      accountCreated:    false,
      createdAt:         todayStr(),
      points:            0,
      currentStreak:     0,
      longestStreak:     0,
      lastActiveDate:    null,
      badges:            [],
      newBadges:         [],               // shown once, then cleared
      quizzesCompleted:  0,
      perfectQuizStreak: 0,
      prayerReactions:   0,
      postCount:         0,
      commentCount:      0,
      sermonViews:       0,
      scriptureDates:    [],
      promptsShown:      [],
      notifPermission:   'default',
      privacy:           'public',
    };
  }

  function loadUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return Object.assign(defaultUser(), JSON.parse(raw));
    } catch { return null; }
  }

  function saveUser(u) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch {}
  }

  /* ────────────────────────────────────────────
     STREAK
  ──────────────────────────────────────────── */
  function touchStreak(u) {
    const today = todayStr();
    if (u.lastActiveDate === today) return; // already counted today
    const last  = u.lastActiveDate;
    if (last && daysBetween(last, today) === 1) {
      u.currentStreak += 1;
    } else if (!last || daysBetween(last, today) > 1) {
      u.currentStreak = 1;
    }
    u.longestStreak  = Math.max(u.longestStreak, u.currentStreak);
    u.lastActiveDate = today;
  }

  /* ────────────────────────────────────────────
     POINTS
  ──────────────────────────────────────────── */
  function awardPoints(u, action) {
    const pts = POINTS_TABLE[action] || 0;
    u.points += pts;
    return pts;
  }

  /* ────────────────────────────────────────────
     BADGES
  ──────────────────────────────────────────── */
  function checkBadges(u) {
    const earned = [];
    BADGES.forEach(b => {
      if (!u.badges.includes(b.id) && b.check(u)) {
        u.badges.push(b.id);
        u.newBadges.push(b.id);
        earned.push(b);
      }
    });
    return earned;
  }

  function getBadgeInfo(id) {
    return BADGES.find(b => b.id === id) || { label: id, desc: '' };
  }

  /* ────────────────────────────────────────────
     ACTIVITY FEED (localStorage, 50-item cap)
  ──────────────────────────────────────────── */
  function loadFeed() {
    try { return JSON.parse(localStorage.getItem(FEED_KEY) || '[]'); } catch { return []; }
  }

  function pushFeedItem(item) {
    const feed = loadFeed();
    feed.unshift({ ...item, id: uid(), ts: Date.now() });
    if (feed.length > 50) feed.length = 50;
    try { localStorage.setItem(FEED_KEY, JSON.stringify(feed)); } catch {}
    // Dispatch event so any open page can react
    window.dispatchEvent(new CustomEvent('coc:feed', { detail: feed[0] }));
  }

  /* ────────────────────────────────────────────
     NOTIFICATIONS
  ──────────────────────────────────────────── */
  function loadNotifPrefs() {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; }
  }

  function saveNotifPrefs(p) {
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(p)); } catch {}
  }

  async function requestNotifPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    const result = await Notification.requestPermission();
    return result;
  }

  /* ────────────────────────────────────────────
     PUBLIC API
  ──────────────────────────────────────────── */
  const COCApp = {
    BADGES,
    POINTS_TABLE,

    // ── Identity ──
    getUser() { return loadUser(); },
    saveUser,
    isSetup() { const u = loadUser(); return u && u.displayName; },

    createUser(displayName, role = 'Visitor') {
      const u = defaultUser();
      u.displayName = displayName.trim();
      u.role = role;
      saveUser(u);
      pushFeedItem({ type: 'join', name: u.displayName, role: u.role });
      return u;
    },

    // ── Daily visit (call on every page load) ──
    recordVisit() {
      let u = loadUser();
      if (!u) return null;
      const wasToday = u.lastActiveDate === todayStr();
      touchStreak(u);
      if (!wasToday) {
        awardPoints(u, 'daily_visit');
        checkBadges(u);
        pushFeedItem({ type: 'visit', name: u.displayName, streak: u.currentStreak });
      }
      saveUser(u);
      return u;
    },

    // ── Scripture read ──
    recordScriptureRead() {
      let u = loadUser(); if (!u) return;
      const today = todayStr();
      if (!u.scriptureDates) u.scriptureDates = [];
      if (!u.scriptureDates.includes(today)) {
        u.scriptureDates.push(today);
        awardPoints(u, 'read_scripture');
        const newBadges = checkBadges(u);
        if (newBadges.length) pushFeedItem({ type: 'badge', name: u.displayName, badge: newBadges[0].label });
        saveUser(u);
      }
    },

    // ── Quiz complete ──
    recordQuiz(perfect = false) {
      let u = loadUser(); if (!u) return;
      u.quizzesCompleted = (u.quizzesCompleted || 0) + 1;
      awardPoints(u, 'quiz_complete');
      if (perfect) {
        u.perfectQuizStreak = (u.perfectQuizStreak || 0) + 1;
        awardPoints(u, 'quiz_perfect');
        pushFeedItem({ type: 'quiz_perfect', name: u.displayName });
      } else {
        u.perfectQuizStreak = 0;
      }
      const nb = checkBadges(u);
      if (nb.length) pushFeedItem({ type: 'badge', name: u.displayName, badge: nb[0].label });
      saveUser(u);
      return u;
    },

    // ── Prayer reaction ──
    recordPrayerReact() {
      let u = loadUser(); if (!u) return;
      u.prayerReactions = (u.prayerReactions || 0) + 1;
      awardPoints(u, 'prayer_react');
      checkBadges(u);
      saveUser(u);
    },

    // ── Sermon view ──
    recordSermonView() {
      let u = loadUser(); if (!u) return;
      u.sermonViews = (u.sermonViews || 0) + 1;
      awardPoints(u, 'sermon_view');
      saveUser(u);
    },

    // ── Comment posted ──
    recordComment() {
      let u = loadUser(); if (!u) return;
      u.commentCount = (u.commentCount || 0) + 1;
      awardPoints(u, 'comment_post');
      checkBadges(u);
      saveUser(u);
    },

    // ── Community post ──
    recordPost() {
      let u = loadUser(); if (!u) return;
      u.postCount = (u.postCount || 0) + 1;
      awardPoints(u, 'comment_post');
      checkBadges(u);
      saveUser(u);
    },

    // ── Reading plan day complete ──
    recordReadingDay() {
      let u = loadUser(); if (!u) return;
      awardPoints(u, 'reading_plan_day');
      saveUser(u);
    },

    // ── Testimony submit ──
    recordTestimony() {
      let u = loadUser(); if (!u) return;
      awardPoints(u, 'testimony_submit');
      pushFeedItem({ type: 'testimony', name: u.displayName });
      saveUser(u);
    },

    // ── Check if account prompt should show ──
    shouldPromptAccount() {
      const u = loadUser(); if (!u || u.accountCreated) return false;
      return ACCOUNT_PROMPTS.some(p => !u.promptsShown.includes(p.key) && p.check(u));
    },

    markPromptShown(key) {
      let u = loadUser(); if (!u) return;
      if (!u.promptsShown.includes(key)) u.promptsShown.push(key);
      saveUser(u);
    },

    // ── Feed ──
    getFeed: loadFeed,
    pushFeedItem,

    // ── Badges ──
    getBadgeInfo,
    getAllBadges() { return BADGES; },

    // ── Notifications ──
    loadNotifPrefs,
    saveNotifPrefs,
    requestNotifPermission,

    // ── Points table ──
    getPointsTable() { return POINTS_TABLE; },

    // ── Leaderboard (local only — all users stored per-browser) ──
    // In a real deploy, this would talk to Firestore. For now, returns current user.
    getLeaderboard() {
      const u = loadUser();
      if (!u || !u.displayName) return [];
      return [{ ...u }];
    },

    // ── Format helpers ──
    fmtStreak(n) { return n === 0 ? 'No streak yet' : `🔥 ${n}-day streak`; },
    fmtPoints(n) { return `🏆 ${n} pts`; },

    formatFeedItem(item) {
      const n = item.name || 'Someone';
      switch (item.type) {
        case 'join':        return `🎉 <strong>${n}</strong> joined the COC community`;
        case 'visit':       return `🔥 <strong>${n}</strong> ${item.streak > 1 ? `reached a ${item.streak}-day streak` : 'visited today'}`;
        case 'badge':       return `🏆 <strong>${n}</strong> earned <em>${item.badge}</em>`;
        case 'quiz_perfect':return `🧠 <strong>${n}</strong> scored 100% on today's quiz!`;
        case 'testimony':   return `✨ <strong>${n}</strong> shared a testimony`;
        case 'plan_done':   return `📚 <strong>${n}</strong> completed a Bible reading plan`;
        case 'scripture':   return `📖 <strong>${n}</strong> read today's scripture`;
        default:            return `<strong>${n}</strong> was active`;
      }
    },

    timeAgo(ts) {
      const diff = Date.now() - ts;
      if (diff < 60000)   return 'just now';
      if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
      if (diff < 86400000)return `${Math.floor(diff/3600000)}h ago`;
      return `${Math.floor(diff/86400000)}d ago`;
    }
  };

  global.COCApp = COCApp;
})(window);