/**
 * COC Scripture Share - Generate shareable images
 * Uses html2canvas to create beautiful scripture cards
 */

(function(global) {
    'use strict';

    // Load html2canvas dynamically
    function loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            if (typeof html2canvas !== 'undefined') {
                resolve(html2canvas);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve(window.html2canvas);
            script.onerror = () => reject(new Error('Failed to load html2canvas'));
            document.head.appendChild(script);
        });
    }

    // Create the share card HTML
    function createShareCard(scripture, customOptions = {}) {
        const options = {
            verse: scripture.verse || 'Trust in the Lord with all your heart.',
            reference: scripture.reference || 'Proverbs 3:5',
            reflection: scripture.reflection || '',
            date: new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            ...customOptions
        };

        // Build the card HTML
        const card = document.createElement('div');
        card.id = 'scripture-share-card';
        card.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 800px;
            height: 600px;
            background: linear-gradient(145deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%);
            border: 2px solid rgba(200,16,46,0.3);
            border-radius: 24px;
            padding: 48px 52px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
            box-shadow: 0 30px 80px rgba(0,0,0,0.8);
            position: relative;
            overflow: hidden;
            z-index: 99999;
        `;

        // Background decorations
        card.innerHTML = `
            <!-- Glow effects -->
            <div style="position:absolute;top:-100px;right:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(200,16,46,0.08),transparent 70%);pointer-events:none;"></div>
            <div style="position:absolute;bottom:-80px;left:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(240,200,66,0.05),transparent 70%);pointer-events:none;"></div>
            
            <!-- Decorative cross watermark -->
            <div style="position:absolute;bottom:20px;right:30px;font-size:120px;color:rgba(200,16,46,0.04);font-family:'Times New Roman',serif;pointer-events:none;line-height:1;">✝</div>
            
            <!-- Top bar with church name -->
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;position:relative;z-index:1;">
                <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#c8102e,#8b0000);display:flex;align-items:center;justify-content:center;font-size:18px;color:#f0c842;font-weight:700;font-family:'Bebas Neue',sans-serif;">COC</div>
                <div style="text-align:left;">
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:#f0c842;letter-spacing:0.15em;text-transform:uppercase;line-height:1.2;">City of Champions</div>
                    <div style="font-size:9px;color:rgba(255,255,255,0.25);letter-spacing:0.08em;text-transform:uppercase;font-family:'Inter',sans-serif;">International Assembly</div>
                </div>
                <div style="margin-left:auto;text-align:right;">
                    <div style="font-size:9px;color:rgba(255,255,255,0.15);letter-spacing:0.1em;text-transform:uppercase;font-family:'Inter',sans-serif;">Scripture of the Day</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.1);font-family:'Inter',sans-serif;">${options.date}</div>
                </div>
            </div>

            <!-- Decorative line -->
            <div style="width:80px;height:1.5px;background:linear-gradient(90deg,transparent,#c8102e,transparent);margin-bottom:30px;"></div>

            <!-- Main verse -->
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;z-index:1;padding:10px 0;">
                <div style="font-family:'Georgia','Cormorant Garamond',serif;font-size:32px;font-style:italic;font-weight:300;color:rgba(255,255,255,0.92);line-height:1.5;max-width:90%;margin-bottom:16px;">
                    ${options.verse}
                </div>
                <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:#f0c842;letter-spacing:0.08em;">
                    — ${options.reference}
                </div>
                ${options.reflection ? `
                <div style="margin-top:20px;font-family:'Georgia','Cormorant Garamond',serif;font-size:14px;color:rgba(255,255,255,0.35);font-style:italic;line-height:1.6;max-width:75%;">
                    ${options.reflection}
                </div>` : ''}
            </div>

            <!-- Decorative line -->
            <div style="width:60px;height:1px;background:rgba(255,255,255,0.06);margin-bottom:16px;"></div>

            <!-- Footer -->
            <div style="display:flex;align-items:center;justify-content:space-between;width:100%;position:relative;z-index:1;">
                <div style="font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.12em;text-transform:uppercase;font-family:'Inter',sans-serif;">
                    <i class="fas fa-fire" style="color:rgba(200,16,46,0.3);margin-right:6px;"></i>
                    Restoring Human Destiny & Dignity
                </div>
                <div style="font-size:10px;color:rgba(255,255,255,0.08);letter-spacing:0.08em;font-family:'Inter',sans-serif;">
                    joincoc.com
                </div>
            </div>

            <!-- Fire ember particles -->
            <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#c8102e,transparent);opacity:0.3;"></div>
        `;

        return card;
    }

    // Main share function
    async function shareScriptureAsImage(scripture, options = {}) {
        try {
            // Show loading state
            const loadingToast = document.createElement('div');
            loadingToast.style.cssText = `
                position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
                background: #1a1a1e; border: 1px solid rgba(200,16,46,0.3);
                border-radius: 16px; padding: 14px 24px; color: #fff;
                font-family: 'Inter', sans-serif; font-size: 14px;
                z-index: 999999; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                display: flex; align-items: center; gap: 12px;
            `;
            loadingToast.innerHTML = `
                <div style="width:20px;height:20px;border-radius:50%;border:2px solid rgba(200,16,46,0.2);border-top-color:#c8102e;animation:spin 0.8s linear infinite;"></div>
                <span>Generating share image...</span>
                <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
            `;
            document.body.appendChild(loadingToast);

            // Load html2canvas
            await loadHtml2Canvas();

            // Create the share card
            const card = createShareCard(scripture, options);
            document.body.appendChild(card);

            // Wait for fonts and rendering
            await new Promise(resolve => setTimeout(resolve, 300));

            // Capture the card
            const canvas = await html2canvas(card, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                logging: false,
                allowTaint: true,
                width: 800,
                height: 600
            });

            // Remove the card and loading toast
            card.remove();
            loadingToast.remove();

            // Convert to data URL
            const imageDataUrl = canvas.toDataURL('image/png');

            // Check if we can share natively
            if (navigator.share && options.shareVia === 'native') {
                const blob = await fetch(imageDataUrl).then(r => r.blob());
                const file = new File([blob], 'scripture-of-the-day.png', { type: 'image/png' });
                await navigator.share({
                    title: 'Scripture of the Day - City of Champions',
                    text: `${scripture.verse} — ${scripture.reference}`,
                    files: [file]
                });
                return { success: true, method: 'native-share' };
            }

            // Download as image
            const link = document.createElement('a');
            link.download = `scripture-${scripture.reference.replace(/\s/g, '-')}.png`;
            link.href = imageDataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return { success: true, method: 'download', dataUrl: imageDataUrl };

        } catch (error) {
            console.error('Share error:', error);
            // Remove any lingering elements
            document.querySelectorAll('#scripture-share-card, .loading-toast').forEach(el => el.remove());
            
            // Fallback: copy text
            const text = `${scripture.verse}\n— ${scripture.reference}\n\nRead more at joincoc.com 🔥`;
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return { success: true, method: 'text-fallback', text };
            }
            return { success: false, error: error.message };
        }
    }

    // Function to show share options (modal)
    function showShareOptions(scripture) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'share-options-modal';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            padding: 20px; animation: fadeIn 0.3s ease;
        `;
        overlay.innerHTML = `
            <style>
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                @keyframes slideUp { from { transform: translateY(20px) scale(0.95); opacity:0; } to { transform: translateY(0) scale(1); opacity:1; } }
            </style>
            <div style="background:#111;border-radius:24px;border:1px solid rgba(200,16,46,0.2);padding:40px 36px;max-width:420px;width:100%;animation:slideUp 0.35s cubic-bezier(0.16,1,0.3,1);">
                <div style="text-align:center;margin-bottom:28px;">
                    <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:#fff;letter-spacing:0.04em;">Share Scripture</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.3);margin-top:4px;">Choose how you want to share</div>
                </div>
                
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <button onclick="window.COCScriptureShare.shareAsImage('${encodeURIComponent(JSON.stringify(scripture))}', 'native')" 
                            style="background:linear-gradient(135deg,#c8102e,#8b0000);color:#fff;border:none;padding:16px 20px;border-radius:14px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.2s;"
                            onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                        <span style="font-size:20px;">📤</span>
                        <span>Share as Image (Native)</span>
                    </button>
                    
                    <button onclick="window.COCScriptureShare.shareAsImage('${encodeURIComponent(JSON.stringify(scripture))}', 'download')" 
                            style="background:rgba(255,255,255,0.05);color:#fff;border:1px solid rgba(255,255,255,0.1);padding:16px 20px;border-radius:14px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.2s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                        <span style="font-size:20px;">⬇️</span>
                        <span>Download as Image</span>
                    </button>
                    
                    <button onclick="window.COCScriptureShare.shareAsText('${encodeURIComponent(JSON.stringify(scripture))}')" 
                            style="background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.06);padding:16px 20px;border-radius:14px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.2s;"
                            onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                        <span style="font-size:20px;">📋</span>
                        <span>Copy as Text</span>
                    </button>
                </div>
                
                <button onclick="this.closest('#share-options-modal').remove()" 
                        style="margin-top:16px;background:none;border:none;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;width:100%;padding:8px;font-family:'Inter',sans-serif;">
                    Cancel
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // Share as image
    window.COCScriptureShare = {
        shareAsImage: async function(scriptureJson, method) {
            const overlay = document.getElementById('share-options-modal');
            if (overlay) overlay.remove();

            try {
                const scripture = typeof scriptureJson === 'string' 
                    ? JSON.parse(decodeURIComponent(scriptureJson)) 
                    : scriptureJson;

                const result = await shareScriptureAsImage(scripture, { shareVia: method });
                
                if (result.success) {
                    // Show success toast
                    const toast = document.createElement('div');
                    toast.style.cssText = `
                        position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
                        background: #1a1a1e; border: 1px solid rgba(74,222,128,0.3);
                        border-radius: 16px; padding: 14px 24px; color: #4ade80;
                        font-family: 'Inter', sans-serif; font-size: 14px;
                        z-index: 999999; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                        display: flex; align-items: center; gap: 10px;
                        animation: slideUp 0.3s ease;
                    `;
                    toast.innerHTML = `
                        <span>✅</span>
                        <span>${method === 'native' ? 'Shared successfully!' : 'Image downloaded!'}</span>
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                }
            } catch (error) {
                console.error('Share error:', error);
                alert('Could not share. Please try again.');
            }
        },

        shareAsText: function(scriptureJson) {
            const overlay = document.getElementById('share-options-modal');
            if (overlay) overlay.remove();

            try {
                const scripture = typeof scriptureJson === 'string' 
                    ? JSON.parse(decodeURIComponent(scriptureJson)) 
                    : scriptureJson;

                const text = `${scripture.verse}\n— ${scripture.reference}\n\nRead more at joincoc.com 🔥`;
                
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(() => {
                        const toast = document.createElement('div');
                        toast.style.cssText = `
                            position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
                            background: #1a1a1e; border: 1px solid rgba(74,222,128,0.3);
                            border-radius: 16px; padding: 14px 24px; color: #4ade80;
                            font-family: 'Inter', sans-serif; font-size: 14px;
                            z-index: 999999; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                            display: flex; align-items: center; gap: 10px;
                        `;
                        toast.innerHTML = `<span>📋</span> <span>Copied to clipboard!</span>`;
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 3000);
                    });
                } else {
                    // Fallback
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                    alert('📋 Copied to clipboard!');
                }
            } catch (error) {
                console.error('Copy error:', error);
                alert('Could not copy. Please try again.');
            }
        },

        // Show share options modal
        showShareOptions: function(scripture) {
            showShareOptions(scripture);
        },

        // Direct share (opens modal)
        share: function(scripture) {
            this.showShareOptions(scripture);
        }
    };

})(window);