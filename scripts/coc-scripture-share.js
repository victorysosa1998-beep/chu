/**
 * COC Scripture Share
 * ─────────────────────────────────────────────────────────────────────────────
 * Button behaviours (no modal pop-up):
 *   Share    → navigator.share(text) / clipboard fallback  — instant, no image
 *   WhatsApp → generate image → native share / download fallback
 *   Download → generate image → save as PNG
 *
 * Card rendering fix: card is appended to a dedicated off-screen wrapper that
 * is 800 px wide and fully visible to html2canvas (no clipping, no transform).
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
    'use strict';

    // ── html2canvas lazy-loader ───────────────────────────────────────────────
    let _h2cPromise = null;
    function loadHtml2Canvas() {
        if (_h2cPromise) return _h2cPromise;
        _h2cPromise = new Promise((resolve, reject) => {
            if (typeof html2canvas !== 'undefined') { resolve(html2canvas); return; }
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload  = () => typeof html2canvas !== 'undefined' ? resolve(html2canvas) : reject(new Error('h2c missing'));
            s.onerror = () => reject(new Error('Failed to load html2canvas'));
            document.head.appendChild(s);
        });
        return _h2cPromise;
    }

    // ── safe HTML escape (used inside card innerHTML) ─────────────────────────
    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── off-screen render host ────────────────────────────────────────────────
    // A fixed-size container parked way off the left of the screen.
    // html2canvas captures from (0,0) inside this element, so nothing is clipped.
    function getRenderHost() {
        let host = document.getElementById('_sotd_render_host');
        if (!host) {
            host = document.createElement('div');
            host.id = '_sotd_render_host';
            host.style.cssText = [
                'position:fixed',
                'top:0',
                'left:-9999px',
                'width:1080px',   // card width
                'height:1080px',  // card height
                'overflow:hidden',
                'pointer-events:none',
                'z-index:-1',
            ].join(';');
            document.body.appendChild(host);
        }
        return host;
    }

    // ── scripture card DOM (1080 × 1080 — square, perfect for IG/WA status) ──
    function buildCard(scripture) {
        const verse      = scripture.verse      || '"Trust in the Lord with all your heart."';
        const reference  = scripture.reference  || 'Proverbs 3:5';
        const reflection = scripture.reflection || '';
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const card = document.createElement('div');
        card.style.cssText = [
            'width:1080px',
            'height:1080px',
            'box-sizing:border-box',
            'background:linear-gradient(150deg,#0d0000 0%,#1c0404 40%,#0a0000 100%)',
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'justify-content:center',
            'padding:80px 90px',
            'position:relative',
            'overflow:hidden',
            'font-family:Georgia,serif',
        ].join(';');

        card.innerHTML = `
            <!-- bg glow top-right -->
            <div style="position:absolute;top:-160px;right:-160px;width:600px;height:600px;
                border-radius:50%;background:radial-gradient(circle,rgba(200,16,46,0.12) 0%,transparent 70%);
                pointer-events:none;"></div>
            <!-- bg glow bottom-left -->
            <div style="position:absolute;bottom:-120px;left:-120px;width:480px;height:480px;
                border-radius:50%;background:radial-gradient(circle,rgba(240,200,66,0.06) 0%,transparent 70%);
                pointer-events:none;"></div>
            <!-- cross watermark -->
            <div style="position:absolute;bottom:40px;right:60px;font-size:260px;line-height:1;
                color:rgba(200,16,46,0.05);font-family:'Times New Roman',serif;
                pointer-events:none;user-select:none;">✝</div>
            <!-- bottom glow line -->
            <div style="position:absolute;bottom:0;left:0;right:0;height:3px;
                background:linear-gradient(90deg,transparent,#c8102e 50%,transparent);
                opacity:0.5;"></div>

            <!-- ── HEADER ── -->
            <div style="display:flex;align-items:center;justify-content:space-between;
                width:100%;margin-bottom:60px;position:relative;z-index:1;">
                <!-- Church badge -->
                <div style="display:flex;align-items:center;gap:18px;">
                    <div style="width:72px;height:72px;border-radius:50%;flex-shrink:0;
                        background:linear-gradient(135deg,#c8102e,#8b0000);
                        display:flex;align-items:center;justify-content:center;
                        overflow:hidden;border:2px solid rgba(240,200,66,0.35);">
                        <img src="/media/logo1.png"
                             crossorigin="anonymous"
                             style="width:100%;height:100%;object-fit:contain;"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
                        <span style="display:none;width:100%;height:100%;align-items:center;
                            justify-content:center;font-size:14px;font-weight:900;color:#f0c842;
                            font-family:'Bebas Neue',Arial Narrow,sans-serif;letter-spacing:0.05em;">COC</span>
                    </div>
                    <div>
                        <div style="font-family:'Bebas Neue',Arial Narrow,sans-serif;font-size:20px;
                            color:#f0c842;letter-spacing:0.18em;text-transform:uppercase;line-height:1.2;">
                            City of Champions</div>
                        <div style="font-size:12px;color:rgba(255,255,255,0.28);letter-spacing:0.1em;
                            text-transform:uppercase;font-family:Inter,Arial,sans-serif;margin-top:2px;">
                            International Assembly</div>
                    </div>
                </div>
                <!-- Label -->
                <div style="text-align:right;">
                    <div style="font-size:12px;color:rgba(200,16,46,0.8);letter-spacing:0.22em;
                        text-transform:uppercase;font-family:Inter,Arial,sans-serif;font-weight:700;">
                        Scripture of the Day</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.15);font-family:Inter,Arial,sans-serif;
                        margin-top:4px;">${esc(date)}</div>
                </div>
            </div>

            <!-- ── DIVIDER ── -->
            <div style="width:100px;height:2px;
                background:linear-gradient(90deg,transparent,#c8102e,transparent);
                margin-bottom:50px;position:relative;z-index:1;"></div>

            <!-- ── VERSE ── -->
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;
                justify-content:center;width:100%;position:relative;z-index:1;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:44px;
                    font-style:italic;font-weight:400;color:rgba(255,255,255,0.93);
                    line-height:1.55;text-align:center;max-width:900px;margin-bottom:28px;">
                    ${esc(verse)}
                </div>
                <div style="font-family:'Bebas Neue',Arial Narrow,sans-serif;font-size:36px;
                    color:#f0c842;letter-spacing:0.12em;text-align:center;">
                    — ${esc(reference)}
                </div>
                ${reflection ? `
                <div style="margin-top:32px;font-family:Georgia,serif;font-size:20px;
                    color:rgba(255,255,255,0.32);font-style:italic;line-height:1.65;
                    text-align:center;max-width:780px;">
                    ${esc(reflection)}
                </div>` : ''}
            </div>

            <!-- ── FOOTER ── -->
            <div style="display:flex;align-items:center;justify-content:space-between;
                width:100%;margin-top:60px;position:relative;z-index:1;">
                <div style="font-size:14px;color:rgba(255,255,255,0.18);letter-spacing:0.12em;
                    text-transform:uppercase;font-family:Inter,Arial,sans-serif;">
                    🔥 Restoring Human Destiny &amp; Dignity
                </div>
                <div style="font-size:16px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;
                    font-family:Inter,Arial,sans-serif;font-weight:600;">
                    joincoc.com
                </div>
            </div>
        `;

        return card;
    }

    // ── image generation ──────────────────────────────────────────────────────
    async function generateImage(scripture) {
        await loadHtml2Canvas();

        const host = getRenderHost();
        host.innerHTML = '';                       // clear previous card
        const card = buildCard(scripture);
        host.appendChild(card);

        // Wait for the logo image to load (or fail) before capturing
        const logoImg = card.querySelector('img[src="/media/logo1.png"]');
        if (logoImg && !logoImg.complete) {
            await new Promise(resolve => {
                logoImg.onload  = resolve;
                logoImg.onerror = resolve;          // still proceed if 404
                setTimeout(resolve, 3000);          // hard timeout safety net
            });
        }
        // one rAF so the browser paints the card before html2canvas reads it
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const canvas = await html2canvas(card, {
            scale: 1,                              // 1× — already 1080px, no need to double
            backgroundColor: '#0d0000',
            useCORS: true,
            allowTaint: true,
            logging: false,
            width:  1080,
            height: 1080,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
        });

        host.innerHTML = '';                       // clean up
        return canvas.toDataURL('image/png');
    }

    // ── toast helpers ─────────────────────────────────────────────────────────
    function toast(msg, color, ms) {
        const t = document.createElement('div');
        t.style.cssText = `
            position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
            background:#111;border:1px solid ${color}44;color:${color};
            border-radius:14px;padding:13px 22px;
            font-family:Inter,Arial,sans-serif;font-size:14px;
            z-index:2147483647;box-shadow:0 16px 48px rgba(0,0,0,0.6);
            display:flex;align-items:center;gap:10px;white-space:nowrap;
        `;
        t.innerHTML = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), ms || 3500);
        return t;
    }
    function toastLoading(msg) {
        const t = document.createElement('div');
        t.id = '_sotd_loading';
        t.style.cssText = `
            position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
            background:#111;border:1px solid rgba(200,16,46,0.35);color:#fff;
            border-radius:14px;padding:13px 22px;
            font-family:Inter,Arial,sans-serif;font-size:14px;
            z-index:2147483647;box-shadow:0 16px 48px rgba(0,0,0,0.6);
            display:flex;align-items:center;gap:12px;white-space:nowrap;
        `;
        t.innerHTML = `
            <div style="width:18px;height:18px;border-radius:50%;
                border:2px solid rgba(200,16,46,0.2);border-top-color:#c8102e;
                animation:_sotdSpin 0.75s linear infinite;flex-shrink:0;"></div>
            <span>${msg || 'Generating image…'}</span>
            <style>@keyframes _sotdSpin{to{transform:rotate(360deg)}}</style>
        `;
        document.body.appendChild(t);
        return t;
    }
    function hideLoading() {
        const t = document.getElementById('_sotd_loading');
        if (t) t.remove();
    }

    // ── dataURL → Blob → File ─────────────────────────────────────────────────
    function dataUrlToFile(dataUrl, name) {
        const [header, b64] = dataUrl.split(',');
        const mime = header.match(/:(.*?);/)[1];
        const bytes = atob(b64);
        const arr   = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        return new File([arr], name, { type: mime });
    }

    // ── download helper ───────────────────────────────────────────────────────
    function triggerDownload(dataUrl, filename) {
        const a  = document.createElement('a');
        a.href   = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Share button — plain text share via Web Share API or clipboard.
     * Instant — no image generation.
     */
    async function shareAsText(scripture) {
        const text = `${scripture.verse}\n— ${scripture.reference}\n\njoincoc.com 🔥`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Scripture of the Day – City of Champions', text });
                return;
            } catch (e) {
                if (e.name === 'AbortError') return;
            }
        }
        // clipboard fallback
        try {
            await navigator.clipboard.writeText(text);
            toast('📋 Copied to clipboard!', '#4ade80');
        } catch {
            // last-resort prompt
            prompt('Copy this scripture:', text);
        }
    }

    /**
     * WhatsApp button — generate image, try native share (with file),
     * fall back to download + instructions.
     */
    async function shareImageWhatsApp(scripture) {
        const tl = toastLoading('Creating image…');
        try {
            const dataUrl  = await generateImage(scripture);
            hideLoading();
            const safeName = `coc-scripture-${(scripture.reference || 'today').replace(/[\s:]/g, '-')}.png`;
            const file     = dataUrlToFile(dataUrl, safeName);

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Scripture of the Day – City of Champions',
                        text: `${scripture.verse} — ${scripture.reference}\n\njoincoc.com`,
                        files: [file],
                    });
                    return;
                } catch (e) {
                    if (e.name === 'AbortError') return;
                    // fall through to download
                }
            }

            // No native file share — download + tip
            triggerDownload(dataUrl, safeName);
            toast('📥 Image saved! Open your gallery to share it on WhatsApp.', '#25D366', 5000);
        } catch (err) {
            hideLoading();
            console.error('[COCShare] WhatsApp error:', err);
            toast('⚠️ Could not create image. Please try again.', '#ef4444');
        }
    }

    /**
     * Download button — generate image and save as PNG.
     */
    async function downloadImage(scripture) {
        const tl = toastLoading('Preparing download…');
        try {
            const dataUrl  = await generateImage(scripture);
            hideLoading();
            const safeName = `coc-scripture-${(scripture.reference || 'today').replace(/[\s:]/g, '-')}.png`;
            triggerDownload(dataUrl, safeName);
            toast('✅ Image downloaded!', '#4ade80');
        } catch (err) {
            hideLoading();
            console.error('[COCShare] Download error:', err);
            toast('⚠️ Could not download image. Please try again.', '#ef4444');
        }
    }

    // Legacy alias kept so existing callers don't break
    function shareAsImage(scripture, method) {
        if (method === 'whatsapp') return shareImageWhatsApp(scripture);
        if (method === 'download') return downloadImage(scripture);
        return shareAsText(scripture);
    }

    // ── export ────────────────────────────────────────────────────────────────
    global.COCScriptureShare = {
        shareAsText,
        shareImageWhatsApp,
        downloadImage,
        generateImage,
        // legacy
        shareAsImage,
        showShareOptions: (s) => shareAsText(s),
    };

})(window);