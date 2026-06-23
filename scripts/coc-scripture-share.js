/**
 * COC Scripture Share - Generate shareable images
 * Uses html2canvas to create beautiful scripture cards
 * Enhanced for WhatsApp sharing
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
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;position:relative;z-index:1;width:100%;">
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
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;z-index:1;padding:10px 0;width:100%;">
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

    // Generate the image and return as data URL
    async function generateImage(scripture, options = {}) {
        try {
            await loadHtml2Canvas();
            const card = createShareCard(scripture, options);
            document.body.appendChild(card);
            await new Promise(resolve => setTimeout(resolve, 300));
            const canvas = await html2canvas(card, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                logging: false,
                allowTaint: true,
                width: 800,
                height: 600
            });
            card.remove();
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Generate image error:', error);
            throw error;
        }
    }

    // Show loading toast
    function showLoading(message) {
        const toast = document.createElement('div');
        toast.id = 'share-loading-toast';
        toast.style.cssText = `
            position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
            background: #1a1a1e; border: 1px solid rgba(200,16,46,0.3);
            border-radius: 16px; padding: 14px 24px; color: #fff;
            font-family: 'Inter', sans-serif; font-size: 14px;
            z-index: 999999; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            display: flex; align-items: center; gap: 12px;
        `;
        toast.innerHTML = `
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid rgba(200,16,46,0.2);border-top-color:#c8102e;animation:spin 0.8s linear infinite;"></div>
            <span>${message || 'Generating image...'}</span>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        `;
        document.body.appendChild(toast);
        return toast;
    }

    function hideLoading() {
        const toast = document.getElementById('share-loading-toast');
        if (toast) toast.remove();
    }

    // Show success toast
    function showSuccess(message) {
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
        toast.innerHTML = `<span>✅</span><span>${message || 'Done!'}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Show error toast
    function showError(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
            background: #1a1a1e; border: 1px solid rgba(239,68,68,0.3);
            border-radius: 16px; padding: 14px 24px; color: #ef4444;
            font-family: 'Inter', sans-serif; font-size: 14px;
            z-index: 999999; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            display: flex; align-items: center; gap: 10px;
        `;
        toast.innerHTML = `<span>⚠️</span><span>${message || 'Something went wrong'}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Share to WhatsApp specifically
    async function shareToWhatsApp(scripture) {
        try {
            const loading = showLoading('Preparing image for WhatsApp...');
            
            // Generate the image
            const imageDataUrl = await generateImage(scripture);
            hideLoading();

            // Convert data URL to blob
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            
            // Create a file
            const file = new File([blob], 'scripture-of-the-day.png', { type: 'image/png' });

            // Check if we can use native share with file
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Scripture of the Day - City of Champions',
                        text: `${scripture.verse} — ${scripture.reference}`,
                        files: [file]
                    });
                    showSuccess('Shared to WhatsApp successfully!');
                    return { success: true, method: 'native-share' };
                } catch (shareError) {
                    // User cancelled or share failed
                    if (shareError.name === 'AbortError') {
                        return { success: false, method: 'cancelled' };
                    }
                    // Fall through to fallback
                }
            }

            // Fallback: Download the image and let user share manually
            const link = document.createElement('a');
            link.download = `scripture-${scripture.reference.replace(/\s/g, '-')}.png`;
            link.href = imageDataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSuccess('Image downloaded! Share it on WhatsApp manually.');
            return { success: true, method: 'download' };

        } catch (error) {
            hideLoading();
            console.error('Share to WhatsApp error:', error);
            showError('Could not share. Please try downloading the image instead.');
            return { success: false, error: error.message };
        }
    }

    // Share as image (main function)
    async function shareAsImage(scripture, method = 'native') {
        try {
            const loading = showLoading('Creating your scripture image...');
            
            // Generate the image
            const imageDataUrl = await generateImage(scripture);
            hideLoading();

            if (method === 'whatsapp') {
                // WhatsApp specific sharing
                return await shareToWhatsApp(scripture);
            }

            // For other sharing methods
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], 'scripture-of-the-day.png', { type: 'image/png' });

            // Try native share with file
            if (method === 'native' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Scripture of the Day - City of Champions',
                        text: `${scripture.verse} — ${scripture.reference}`,
                        files: [file]
                    });
                    showSuccess('Shared successfully!');
                    return { success: true, method: 'native-share' };
                } catch (shareError) {
                    if (shareError.name === 'AbortError') {
                        return { success: false, method: 'cancelled' };
                    }
                    // Fall through to download
                }
            }

            // Download as fallback
            const link = document.createElement('a');
            link.download = `scripture-${scripture.reference.replace(/\s/g, '-')}.png`;
            link.href = imageDataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSuccess('Image downloaded!');
            return { success: true, method: 'download' };

        } catch (error) {
            hideLoading();
            console.error('Share error:', error);
            showError('Could not share. Please try again.');
            return { success: false, error: error.message };
        }
    }

    // Show share options modal
    function showShareOptions(scripture) {
        // Remove existing modal if any
        const existing = document.getElementById('share-options-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'share-options-modal';
        overlay.className = 'share-modal-overlay';
        overlay.innerHTML = `
            <div class="share-modal-box">
                <div class="share-modal-title">📖 Share Scripture</div>
                <div class="share-modal-sub">Choose how you want to share</div>
                
                <div class="share-btn-group">
                    <button class="share-btn share-btn-primary" onclick="window.COCScriptureShare.shareAsImage(${JSON.stringify(scripture)}, 'whatsapp')">
                        <span class="share-btn-icon">💬</span>
                        <span>Share to WhatsApp</span>
                    </button>
                    
                    <button class="share-btn share-btn-secondary" onclick="window.COCScriptureShare.shareAsImage(${JSON.stringify(scripture)}, 'native')">
                        <span class="share-btn-icon">📤</span>
                        <span>Share via Native</span>
                    </button>
                    
                    <button class="share-btn share-btn-secondary" onclick="window.COCScriptureShare.shareAsImage(${JSON.stringify(scripture)}, 'download')">
                        <span class="share-btn-icon">⬇️</span>
                        <span>Download as Image</span>
                    </button>
                    
                    <button class="share-btn share-btn-text" onclick="window.COCScriptureShare.copyAsText(${JSON.stringify(scripture)})">
                        <span class="share-btn-icon">📋</span>
                        <span>Copy as Text</span>
                    </button>
                </div>
                
                <button class="share-cancel" onclick="this.closest('#share-options-modal').remove()">
                    Cancel
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // Copy as text (fallback)
    function copyAsText(scripture) {
        const text = `${scripture.verse}\n— ${scripture.reference}\n\nRead more at joincoc.com 🔥`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showSuccess('Copied to clipboard!');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
        
        // Close modal
        const modal = document.getElementById('share-options-modal');
        if (modal) modal.remove();
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showSuccess('Copied to clipboard!');
        } catch (e) {
            showError('Could not copy. Please try again.');
        }
        textarea.remove();
    }

    // Public API
    global.COCScriptureShare = {
        generateImage,
        shareAsImage,
        shareToWhatsApp,
        showShareOptions,
        copyAsText,
        share: showShareOptions, // Alias for convenience
    };

})(window);