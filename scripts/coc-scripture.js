/**
 * COC Scripture System - Daily Bible Verse
 */

(function(global) {
    'use strict';

    const SCRIPTURES = [
        { verse: '"Trust in the Lord with all your heart and lean not on your own understanding."', reference: 'Proverbs 3:5', reflection: 'God invites us to trust Him completely, even when we don\'t understand His ways.' },
        { verse: '"I can do all things through Christ who strengthens me."', reference: 'Philippians 4:13', reflection: 'Your strength comes from Christ, not your own abilities.' },
        { verse: '"The Lord is my shepherd; I shall not want."', reference: 'Psalm 23:1', reflection: 'With God as your shepherd, you have everything you need.' },
        { verse: '"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."', reference: 'Joshua 1:9', reflection: 'God\'s presence is with you always — you don\'t need to fear.' },
        { verse: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."', reference: 'Romans 8:28', reflection: 'Even difficult circumstances are part of God\'s good plan for your life.' },
        { verse: '"The Lord is my light and my salvation — whom shall I fear?"', reference: 'Psalm 27:1', reflection: 'God\'s light dispels all darkness. You have nothing to fear.' },
        { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', reference: 'John 3:16', reflection: 'God\'s love for you is so deep that He gave His very best — His Son.' },
        { verse: '"Cast all your anxiety on him because he cares for you."', reference: '1 Peter 5:7', reflection: 'You don\'t have to carry your burdens alone. God cares for you deeply.' },
        { verse: '"The Lord is near to all who call on him, to all who call on him in truth."', reference: 'Psalm 145:18', reflection: 'God is always close, ready to hear your prayers.' },
        { verse: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles."', reference: 'Isaiah 40:31', reflection: 'Renew your strength by placing your hope in God.' },
        { verse: '"Delight yourself in the Lord, and he will give you the desires of your heart."', reference: 'Psalm 37:4', reflection: 'Find your joy in God, and He will fulfill the deepest desires of your heart.' },
        { verse: '"No weapon forged against you will prevail."', reference: 'Isaiah 54:17', reflection: 'God is your protector. No attack can overcome His protection over you.' }
    ];

    const PRAYERS = [
        'Lord, help me to trust You more deeply today. Let Your Word guide my steps.',
        'Father, thank You for Your constant presence. Fill me with Your peace.',
        'Lord, I surrender my fears to You. Give me courage and strength.',
        'Heavenly Father, open my eyes to see Your goodness today.',
        'Lord, guide my heart to love others as You have loved me.'
    ];

    function getTodayIndex() {
        const day = new Date().getDate();
        const month = new Date().getMonth();
        return (day + month * 31) % SCRIPTURES.length;
    }

    function getScriptureOfDay() {
        const index = getTodayIndex();
        return {
            ...SCRIPTURES[index],
            prayer: PRAYERS[index % PRAYERS.length],
            date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        };
    }

    function renderScriptureWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scripture = getScriptureOfDay();
        const user = window.COCUser ? window.COCUser.getUser() : null;
        const isLoggedIn = user && user.displayName;

        container.innerHTML = `
            <div class="sotd-section" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%); padding: 60px 40px; border-radius: 20px; position: relative; overflow: hidden;">
                <div class="sotd-inner" style="max-width: 800px; margin: 0 auto; text-align: center; position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                        <span style="display: block; width: 30px; height: 1.5px; background: #c8102e;"></span>
                        <span style="color: #c8102e; font-size: 10px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; font-family: 'Inter', sans-serif;">📖 Scripture of the Day</span>
                        <span style="display: block; width: 30px; height: 1.5px; background: #c8102e;"></span>
                    </div>
                    <p style="font-family: 'Cormorant Garamond', serif; font-size: clamp(1.4rem, 3.5vw, 2.2rem); color: rgba(255,255,255,0.9); font-style: italic; font-weight: 300; line-height: 1.6; margin-bottom: 16px;">
                        ${scripture.verse}
                    </p>
                    <p style="font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; color: #f0c842; letter-spacing: 0.1em; margin-bottom: 20px;">
                        ${scripture.reference}
                    </p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 0.9rem; color: rgba(255,255,255,0.5); line-height: 1.7; max-width: 600px; margin: 0 auto 24px;">
                        ${scripture.reflection}
                    </p>
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.08);">
                        <p style="font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: rgba(255,255,255,0.6); font-style: italic; line-height: 1.6;">
                            🙏 ${scripture.prayer}
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.COCScripture.shareScripture()" style="background: #c8102e; color: #fff; border: none; padding: 10px 20px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s;" onmouseover="this.style.background='#8b0000'" onmouseout="this.style.background='#c8102e'">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                        ${isLoggedIn ? `
                        <button onclick="window.COCUser.recordScriptureRead(); window.location.reload();" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; cursor: pointer; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <i class="fas fa-check"></i> Mark Read
                        </button>
                        ` : ''}
                    </div>
                    ${isLoggedIn ? `
                    <div style="margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.3); font-family: 'Inter', sans-serif;">
                        ${user.scriptureDays && user.scriptureDays.includes(new Date().toISOString().slice(0, 10)) ? '✅ Read today' : '📌 Read today\'s scripture to earn points and maintain your streak'}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function shareScripture() {
        const scripture = getScriptureOfDay();
        const text = `${scripture.verse} — ${scripture.reference}\n\n${scripture.reflection}`;
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
        SCRIPTURES,
        PRAYERS
    };

})(window);