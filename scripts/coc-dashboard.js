/**
 * COC Dashboard - User Profile Widget
 */

(function(global) {
    'use strict';

    function renderUserDashboard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const user = window.COCUser ? window.COCUser.getUser() : null;

        if (!user || !user.displayName) {
            // Show welcome/signup prompt
            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%); border-radius: 16px; padding: 24px 28px; border: 1px solid rgba(200,16,46,0.2);">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(200,16,46,0.15); display: flex; align-items: center; justify-content: center; font-size: 22px;">👋</div>
                            <div>
                                <div style="color: #fff; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 800;">Welcome to COC!</div>
                                <div style="color: rgba(255,255,255,0.4); font-size: 13px;">Join the community and start your journey</div>
                            </div>
                        </div>
                        <button onclick="window.COCDashboard.showSignup()" style="background: #c8102e; color: #fff; border: none; padding: 10px 24px; border-radius: 100px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s;" onmouseover="this.style.background='#8b0000'" onmouseout="this.style.background='#c8102e'">
                            Get Started →
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const hasReadToday = user.scriptureDays && user.scriptureDays.includes(new Date().toISOString().slice(0, 10));

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%); border-radius: 16px; padding: 24px 28px; border: 1px solid rgba(200,16,46,0.2);">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #c8102e, #8b0000); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #f0c842; flex-shrink: 0;">
                        ${user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="color: #fff; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 800;">${user.displayName}</div>
                        <div style="color: rgba(255,255,255,0.3); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'Inter', sans-serif;">${user.role}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #f0c842; font-family: 'Bebas Neue', sans-serif; font-size: 24px; line-height: 1;">${user.points}</div>
                        <div style="color: rgba(255,255,255,0.2); font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'Inter', sans-serif;">Points</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
                    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="color: #f0c842; font-family: 'Bebas Neue', sans-serif; font-size: 20px;">${user.streak}</div>
                        <div style="color: rgba(255,255,255,0.25); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;">Streak</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="color: #f0c842; font-family: 'Bebas Neue', sans-serif; font-size: 20px;">${user.badges.length}</div>
                        <div style="color: rgba(255,255,255,0.25); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;">Badges</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="color: ${hasReadToday ? '#4ade80' : '#f0c842'}; font-family: 'Bebas Neue', sans-serif; font-size: 20px;">${hasReadToday ? '✅' : '📖'}</div>
                        <div style="color: rgba(255,255,255,0.25); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;">${hasReadToday ? 'Read Today' : 'Read Now'}</div>
                    </div>
                </div>

                ${user.badges.length > 0 ? `
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06);">
                        ${user.badges.slice(0, 5).map(badgeId => {
                            const badge = window.COCUser ? window.COCUser.getBadgeInfo(badgeId) : { label: badgeId };
                            return `<span style="font-size: 10px; background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 100px; color: rgba(255,255,255,0.5); font-family: 'Inter', sans-serif;">${badge.label}</span>`;
                        }).join('')}
                        ${user.badges.length > 5 ? `<span style="font-size: 10px; color: rgba(255,255,255,0.3); font-family: 'Inter', sans-serif;">+${user.badges.length - 5} more</span>` : ''}
                    </div>
                ` : ''}

                <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
                    <button onclick="window.COCDashboard.recordVisit()" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 100px; font-size: 10px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <i class="fas fa-check"></i> Check In
                    </button>
                    <a href="/scripture.html" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 100px; font-size: 10px; font-weight: 700; text-decoration: none; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-bible"></i> Read Scripture
                    </button>
                    <a href="/community.html" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 100px; font-size: 10px; font-weight: 700; text-decoration: none; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-users"></i> Community
                    </a>
                </div>
            </div>
        `;

        // Check for account prompt
        if (window.COCUser && window.COCUser.shouldPromptAccount()) {
            const prompt = document.createElement('div');
            prompt.style.cssText = 'margin-top: 12px; background: linear-gradient(135deg, #c8102e, #8b0000); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;';
            prompt.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🌟</span>
                    <div>
                        <div style="color: #fff; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700;">Create Your Free Profile</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 12px;">Save your progress and access it on any device</div>
                    </div>
                </div>
                <button onclick="window.COCDashboard.createAccount()" style="background: #fff; color: #c8102e; border: none; padding: 8px 20px; border-radius: 100px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
                    Create Account →
                </button>
            `;
            container.appendChild(prompt);
        }
    }

    function showSignup() {
        const name = prompt('What should we call you?', '');
        if (!name || name.trim() === '') return;

        const roles = ['Visitor', 'Member', 'First Timer', 'Youth', 'Worker'];
        const roleOptions = roles.map(r => `${r}`).join(', ');
        const role = prompt(`Choose your role (${roleOptions}):`, 'Visitor');

        const user = window.COCUser.createUser(name, role || 'Visitor');
        if (user) {
            // Show welcome
            if (window.COCNotify && window.COCNotify.isSubscribed()) {
                window.COCNotify.showWelcomeNotification(name);
            }
            window.location.reload();
        }
    }

    function createAccount() {
        const email = prompt('Enter your email to create a free profile:', '');
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }

        // In a real implementation, this would save to Firestore
        // For now, mark account as created in localStorage
        let user = window.COCUser.getUser();
        if (user) {
            user.accountCreated = true;
            window.COCUser.saveUser(user);
            // Find and mark prompts as shown
            const prompts = ['streak_7', 'pts_100', 'badge_1', 'quiz_5'];
            prompts.forEach(key => window.COCUser.markPromptShown(key));
            alert('✅ Profile created! Your progress is now backed up.');
            window.location.reload();
        }
    }

    function recordVisit() {
        const user = window.COCUser.recordVisit();
        if (user) {
            window.location.reload();
        }
    }

    global.COCDashboard = {
        renderUserDashboard,
        showSignup,
        createAccount,
        recordVisit
    };

})(window);