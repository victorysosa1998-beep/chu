/**
 * COC Feed System - Community Activity Feed
 * Handles: Feed items, reactions, comments, sharing
 */

(function(global) {
    'use strict';

    const FEED_KEY = 'coc_activity_feed';
    const REACTIONS = ['🔥', '❤️', '🙏', '👏', '💪', '✨', '🎉', '😭'];

    function getFeed() {
        try {
            return JSON.parse(localStorage.getItem(FEED_KEY) || '[]');
        } catch { return []; }
    }

    function pushFeedItem(item) {
        try {
            let feed = getFeed();
            const newItem = {
                ...item,
                id: 'feed_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                timestamp: Date.now(),
                reactions: {},
                comments: [],
                shares: 0,
                views: 0
            };
            feed.unshift(newItem);
            if (feed.length > 100) feed = feed.slice(0, 100);
            localStorage.setItem(FEED_KEY, JSON.stringify(feed));
            window.dispatchEvent(new CustomEvent('coc:feed', { detail: newItem }));
            return newItem;
        } catch { return null; }
    }

    function getFeedItem(id) {
        const feed = getFeed();
        return feed.find(item => item.id === id) || null;
    }

    function addReaction(feedId, reaction) {
        if (!REACTIONS.includes(reaction)) return { success: false, reason: 'Invalid reaction' };

        const feed = getFeed();
        const item = feed.find(i => i.id === feedId);
        if (!item) return { success: false, reason: 'Item not found' };

        if (!item.reactions) item.reactions = {};
        if (!item.reactions[reaction]) item.reactions[reaction] = 0;
        item.reactions[reaction] += 1;

        localStorage.setItem(FEED_KEY, JSON.stringify(feed));
        window.dispatchEvent(new CustomEvent('coc:feed-reaction', { detail: { feedId, reaction } }));
        return { success: true };
    }

    function addComment(feedId, comment, userName) {
        const feed = getFeed();
        const item = feed.find(i => i.id === feedId);
        if (!item) return { success: false, reason: 'Item not found' };

        if (!item.comments) item.comments = [];
        item.comments.push({
            id: 'cmt_' + Date.now(),
            user: userName || 'Anonymous',
            text: comment,
            timestamp: Date.now()
        });

        localStorage.setItem(FEED_KEY, JSON.stringify(feed));
        window.dispatchEvent(new CustomEvent('coc:feed-comment', { detail: { feedId, comment } }));
        return { success: true };
    }

    function shareFeed(feedId) {
        const feed = getFeed();
        const item = feed.find(i => i.id === feedId);
        if (!item) return { success: false, reason: 'Item not found' };

        item.shares = (item.shares || 0) + 1;
        localStorage.setItem(FEED_KEY, JSON.stringify(feed));
        return { success: true };
    }

    function getFeedByType(type, limit = 10) {
        const feed = getFeed();
        const filtered = type === 'all' ? feed : feed.filter(i => i.type === type);
        return filtered.slice(0, limit);
    }

    function getFeedByUser(userName, limit = 10) {
        const feed = getFeed();
        const filtered = feed.filter(i => i.name === userName);
        return filtered.slice(0, limit);
    }

    function formatFeedItem(item) {
        const name = item.name || 'Someone';

        const typeMap = {
            join: { icon: '🎉', text: `joined the COC family` },
            badge: { icon: '🏆', text: `earned <strong>${item.badge}</strong>` },
            quiz_perfect: { icon: '🧠', text: `scored 100% on today's quiz!` },
            testimony: { icon: '✨', text: `shared a testimony` },
            scripture: { icon: '📖', text: `read today's scripture` },
            streak: { icon: '🔥', text: `reached a ${item.streak}-day streak` },
            prayer: { icon: '🙏', text: `is praying for others` },
            challenge: { icon: '💪', text: `completed the ${item.challenge} challenge` },
            leader: { icon: '👑', text: `is now #1 on the leaderboard!` },
            sermon: { icon: '🎬', text: `watched "${item.sermon}"` },
            event: { icon: '📅', text: `is attending ${item.event}` },
            birthday: { icon: '🎂', text: `is celebrating their birthday!` },
            milestone: { icon: '🌟', text: `reached ${item.milestone}` },
            post: { icon: '💬', text: `shared a post` },
            reaction: { icon: '🔥', text: `reacted to a post` }
        };

        const format = typeMap[item.type] || { icon: '📌', text: `was active` };
        return `<div class="feed-icon">${format.icon}</div> <span><strong>${name}</strong> ${format.text}</span>`;
    }

    function timeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
        return new Date(timestamp).toLocaleDateString();
    }

    function renderFeed(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { limit = 20, type = 'all', filter = null } = options;
        let feed = getFeed();

        if (type !== 'all') {
            feed = feed.filter(i => i.type === type);
        }

        if (filter) {
            feed = feed.filter(filter);
        }

        const items = feed.slice(0, limit);

        if (items.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">
                    <div style="font-size: 2rem; margin-bottom: 12px;">🌟</div>
                    <p style="font-size: 14px; font-family: 'Inter', sans-serif;">No activity yet. Be the first to start the feed!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            const reactions = item.reactions || {};
            const reactionKeys = Object.keys(reactions);
            const reactionStr = reactionKeys.length > 0
                ? reactionKeys.map(r => `${r} ${reactions[r]}`).join(' ')
                : '';

            return `
                <div class="feed-item" style="display: flex; align-items: stretch; gap: 12px; padding: 12px 16px; background: #fff; border-radius: 12px; border: 1px solid rgba(0,0,0,0.04); transition: all 0.2s; margin-bottom: 8px;" data-feed-id="${item.id}">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0;">
                        <div style="font-size: 18px;">${formatFeedItem(item).match(/<div class="feed-icon">(.*?)<\/div>/)?.[1] || '📌'}</div>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 13px; line-height: 1.5; color: #1a1a1a;">
                            ${formatFeedItem(item).replace(/<div class="feed-icon">.*?<\/div>/, '')}
                        </div>
                        ${item.content ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-style: italic; padding-left: 4px;">"${item.content}"</div>` : ''}
                        <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
                            <span style="font-size: 11px; color: #9ca3af; font-family: 'Inter', sans-serif;">${timeAgo(item.timestamp)}</span>
                            ${reactionStr ? `<span style="font-size: 12px;">${reactionStr}</span>` : ''}
                            ${item.comments && item.comments.length > 0 ? `<span style="font-size: 11px; color: #9ca3af;">💬 ${item.comments.length}</span>` : ''}
                            ${item.shares ? `<span style="font-size: 11px; color: #9ca3af;">🔄 ${item.shares}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; flex-shrink: 0;">
                        <button onclick="window.COCFeed.reactToFeed('${item.id}', '🔥')" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">🔥</button>
                        <button onclick="window.COCFeed.reactToFeed('${item.id}', '🙏')" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">🙏</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderFeedWidget(containerId, limit = 5) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const feed = getFeed();
        const items = feed.slice(0, limit);

        container.innerHTML = `
            <div style="background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04);">
                <div style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <span style="font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800;">🔥 Community Activity</span>
                        <span style="font-size: 10px; color: #9ca3af; margin-left: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Live</span>
                    </div>
                    <a href="/community.html" style="font-size: 11px; color: #c8102e; font-weight: 700; text-decoration: none; letter-spacing: 0.05em; font-family: 'Inter', sans-serif;">View All →</a>
                </div>
                <div style="padding: 8px 16px 16px;">
                    ${items.length === 0 ? `
                        <div style="text-align: center; padding: 30px 10px; color: #9ca3af;">
                            <div style="font-size: 1.5rem; margin-bottom: 8px;">🌟</div>
                            <p style="font-size: 13px; font-family: 'Inter', sans-serif;">No activity yet. Start engaging!</p>
                        </div>
                    ` : items.map(item => `
                        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 4px; border-bottom: 1px solid rgba(0,0,0,0.03);">
                            ${formatFeedItem(item)}
                            <span style="margin-left: auto; font-size: 10px; color: #d1d5db; font-family: 'Inter', sans-serif; white-space: nowrap;">${timeAgo(item.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function reactToFeed(feedId, reaction) {
        const result = addReaction(feedId, reaction);
        if (result.success) {
            // Re-render the feed
            const widgets = document.querySelectorAll('[data-feed-widget]');
            widgets.forEach(widget => {
                renderFeedWidget(widget.id, parseInt(widget.dataset.limit) || 5);
            });
            const feeds = document.querySelectorAll('[data-feed-container]');
            feeds.forEach(feed => {
                renderFeed(feed.id, { limit: parseInt(feed.dataset.limit) || 20 });
            });
        }
    }

    // Listen for feed updates
    window.addEventListener('coc:feed', function(e) {
        const widgets = document.querySelectorAll('[data-feed-widget]');
        widgets.forEach(widget => {
            renderFeedWidget(widget.id, parseInt(widget.dataset.limit) || 5);
        });
        const feeds = document.querySelectorAll('[data-feed-container]');
        feeds.forEach(feed => {
            renderFeed(feed.id, { limit: parseInt(feed.dataset.limit) || 20 });
        });
    });

    global.COCFeed = {
        getFeed,
        pushFeedItem,
        getFeedItem,
        addReaction,
        addComment,
        shareFeed,
        getFeedByType,
        getFeedByUser,
        formatFeedItem,
        timeAgo,
        renderFeed,
        renderFeedWidget,
        reactToFeed,
        REACTIONS
    };

})(window);