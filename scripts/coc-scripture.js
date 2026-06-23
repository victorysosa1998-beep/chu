/**
 * COC Scripture System - Daily Bible Verse
 * Uses Firebase as the source of truth
 */

(function(global) {
    'use strict';

    // These are now fallbacks only - Firebase is the primary source
    const FALLBACK_SCRIPTURES = [
        { verse: '"Trust in the Lord with all your heart and lean not on your own understanding."', reference: 'Proverbs 3:5', reflection: 'God invites us to trust Him completely, even when we don\'t understand His ways.', prayer: 'Lord, help me to trust You more deeply today.' },
        { verse: '"I can do all things through Christ who strengthens me."', reference: 'Philippians 4:13', reflection: 'Your strength comes from Christ, not your own abilities.', prayer: 'Father, thank You for Your constant presence.' },
        // ... keep all your verses here
    ];

    const PRAYERS = [
        'Lord, help me to trust You more deeply today. Let Your Word guide my steps.',
        'Father, thank You for Your constant presence. Fill me with Your peace.',
        // ... keep all your prayers here
    ];

    let cachedScripture = null;
    let cachedDate = null;

    // Holds the scripture object currently shown in the widget so share
    // buttons never need to round-trip JSON through an HTML attribute
    // (that was the bug: quotes/apostrophes in verse text broke onclick="...").
    let currentScripture = null;

    async function getScriptureOfDay() {
        const today = new Date().toISOString().split('T')[0];

        if (cachedScripture && cachedDate === today) {
            return cachedScripture;
        }

        try {
            const module = await import('/scripts/coc-scripture-firebase.js');
            const scripture = await module.getScriptureOfDay();
            cachedScripture = scripture;
            cachedDate = today;
            return scripture;
        } catch (error) {
            console.warn('Firebase module not available, using fallback:', error);
            const day = new Date().getDate();
            const month = new Date().getMonth();
            const index = (day + month * 31) % FALLBACK_SCRIPTURES.length;
            cachedScripture = {
                ...FALLBACK_SCRIPTURES[index],
                prayer: PRAYERS[index % PRAYERS.length],
                date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            };
            cachedDate = today;
            return cachedScripture;
        }
    }

    // Tiny helper so verse/reflection/prayer text can never break the
    // markup we inject, regardless of quotes, apostrophes, or HTML chars.
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function renderScriptureWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const scripture = await getScriptureOfDay();
            currentScripture = scripture;

            const user = window.COCUser ? window.COCUser.getUser() : null;
            const isLoggedIn = user && user.displayName;

            // Load the share script
            await import('/scripts/coc-scripture-share.js');

            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%); padding: 40px 30px; border-radius: 20px; border: 1px solid rgba(200,16,46,0.2); text-align: center; position: relative; overflow: hidden;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px;">
                        <span style="display: block; width: 30px; height: 1.5px; background: #c8102e;"></span>
                        <span style="color: #c8102e; font-size: 10px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; font-family: 'Inter', sans-serif;">📖 Scripture of the Day</span>
                        <span style="display: block; width: 30px; height: 1.5px; background: #c8102e;"></span>
                    </div>
                    <p class="sotd-verse" style="font-family: 'Cormorant Garamond', serif; font-size: clamp(1.2rem, 2.5vw, 1.8rem); color: rgba(255,255,255,0.9); font-style: italic; font-weight: 300; line-height: 1.6; margin-bottom: 12px;">
                        ${escapeHtml(scripture.verse)}
                    </p>
                    <p class="sotd-ref" style="font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: #f0c842; letter-spacing: 0.1em;">
                        ${escapeHtml(scripture.reference)}
                    </p>
                    ${scripture.reflection ? `
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.85rem; color: rgba(255,255,255,0.4); line-height: 1.6; max-width: 600px; margin: 16px auto 0;">
                        ${escapeHtml(scripture.reflection)}
                    </p>` : ''}
                    ${scripture.prayer ? `
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px 18px; margin-top: 16px; border: 1px solid rgba(255,255,255,0.08);">
                        <p style="font-family: 'Cormorant Garamond', serif; font-size: 0.95rem; color: rgba(255,255,255,0.5); font-style: italic; line-height: 1.6;">
                            🙏 ${escapeHtml(scripture.prayer)}
                        </p>
                    </div>` : ''}
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 16px;">
                        <button type="button" data-sotd-action="share"
                                style="background: #c8102e; color: #fff; border: none; padding: 10px 20px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s;"
                                onmouseover="this.style.background='#8b0000'" onmouseout="this.style.background='#c8102e'">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                        <button type="button" data-sotd-action="whatsapp"
                                style="background: #25D366; color: #fff; border: none; padding: 10px 20px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s;"
                                onmouseover="this.style.background='#1da851'" onmouseout="this.style.background='#25D366'">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </button>
                        <button type="button" data-sotd-action="download"
                                style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.12); padding: 10px 20px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s;"
                                onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                    ${isLoggedIn ? `
                    <div style="margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.2); font-family: 'Inter', sans-serif;">
                        ${user.scriptureDays && user.scriptureDays.includes(new Date().toISOString().slice(0, 10)) ? '✅ Read today' : '📌 Read today\'s scripture to earn points'}
                    </div>
                    ` : ''}
                </div>
            `;

            // Wire up the share buttons with real event listeners instead of
            // inline onclick="...JSON.stringify(scripture)..." — that approach
            // broke the moment a verse contained a quote mark or apostrophe.
            const shareBtn = container.querySelector('[data-sotd-action="share"]');
            const whatsappBtn = container.querySelector('[data-sotd-action="whatsapp"]');
            const downloadBtn = container.querySelector('[data-sotd-action="download"]');

            if (shareBtn) {
                shareBtn.addEventListener('click', () => {
                    if (window.COCScriptureShare) {
                        window.COCScriptureShare.showShareOptions(currentScripture);
                    }
                });
            }
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', () => {
                    if (window.COCScriptureShare) {
                        window.COCScriptureShare.shareAsImage(currentScripture, 'whatsapp');
                    }
                });
            }
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    if (window.COCScriptureShare) {
                        window.COCScriptureShare.shareAsImage(currentScripture, 'download');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading scripture:', error);
            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%); padding: 40px 30px; border-radius: 20px; border: 1px solid rgba(200,16,46,0.2); text-align: center;">
                    <p style="color: rgba(255,255,255,0.5);">Loading Scripture of the Day...</p>
                </div>
            `;
        }
    }

    function shareScripture() {
        const verseEl = document.querySelector('#scriptureWidget .sotd-verse, #scriptureWidget p:first-of-type');
        const refEl = document.querySelector('#scriptureWidget .sotd-ref, #scriptureWidget .bebas');

        let verse = verseEl?.textContent || 'Trust in the Lord with all your heart.';
        let ref = refEl?.textContent || 'Proverbs 3:5';

        const text = `${verse} — ${ref}\n\nRead more at joincoc.com 🔥`;
        if (navigator.share) {
            navigator.share({ title: 'Scripture of the Day', text: text });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('📋 Copied to clipboard!');
            }).catch(() => {
                prompt('Copy this:', text);
            });
        }
    }

    global.COCScripture = {
        getScriptureOfDay,
        renderScriptureWidget,
        shareScripture,
        FALLBACK_SCRIPTURES,
        PRAYERS,
        getCurrentScripture: () => currentScripture
    };

})(window);