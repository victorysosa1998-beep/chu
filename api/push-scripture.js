/**
 * GET /api/push-scripture
 * Called by Vercel Cron at 06:00 every day (WAT = UTC+1, so cron fires at 05:00 UTC).
 * Fetches today's scripture from Firestore (same logic as coc-scripture-firebase.js)
 * and sends a Web Push notification to every stored subscription.
 *
 * Required env vars (set in Vercel dashboard → Settings → Environment Variables):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      (paste the full multi-line key, Vercel stores it safely)
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_MAILTO              e.g. mailto:admin@joincoc.com
 *   CRON_SECRET               a random string you invent – keeps the endpoint private
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore }            from 'firebase-admin/firestore';
import { credential }              from 'firebase-admin';
import webpush                     from 'web-push';

// ── Firebase Admin ──
if (!getApps().length) {
    initializeApp({
        credential: credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}
const db = getFirestore();

// ── VAPID ──
webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// ── Fallback scriptures (same as coc-scripture-firebase.js) ──
const FALLBACK_SCRIPTURES = [
    { verse: 'Trust in the Lord with all your heart and lean not on your own understanding.', reference: 'Proverbs 3:5' },
    { verse: 'I can do all things through Christ who strengthens me.',                        reference: 'Philippians 4:13' },
    { verse: 'The Lord is my shepherd; I shall not want.',                                    reference: 'Psalm 23:1' },
    { verse: 'Be strong and courageous. Do not be afraid; do not be discouraged.',            reference: 'Joshua 1:9' },
    { verse: 'In all things God works for the good of those who love him.',                   reference: 'Romans 8:28' },
    { verse: 'The Lord is my light and my salvation — whom shall I fear?',                    reference: 'Psalm 27:1' },
    { verse: 'I know the plans I have for you, plans to prosper you and not to harm you.',    reference: 'Jeremiah 29:11' },
    { verse: 'Ask and it will be given to you; seek and you will find.',                      reference: 'Matthew 7:7' },
    { verse: 'Come to me, all you who are weary and burdened, and I will give you rest.',     reference: 'Matthew 11:28' },
    { verse: 'The name of the Lord is a fortified tower; the righteous run to it.',           reference: 'Proverbs 18:10' },
    { verse: 'Delight yourself in the Lord and he will give you the desires of your heart.',  reference: 'Psalm 37:4' },
    { verse: 'No weapon forged against you will prevail.',                                    reference: 'Isaiah 54:17' },
    { verse: 'Those who hope in the Lord will renew their strength.',                         reference: 'Isaiah 40:31' },
    { verse: 'Cast all your anxiety on him because he cares for you.',                        reference: '1 Peter 5:7' },
    { verse: 'The Lord is near to all who call on him in truth.',                             reference: 'Psalm 145:18' },
    { verse: 'For God so loved the world that he gave his one and only Son.',                 reference: 'John 3:16' },
    { verse: 'If God is for us, who can be against us?',                                      reference: 'Romans 8:31' },
    { verse: 'The Lord will fight for you; you need only to be still.',                       reference: 'Exodus 14:14' },
    { verse: 'My grace is sufficient for you, for my power is made perfect in weakness.',     reference: '2 Corinthians 12:9' },
    { verse: 'God is our refuge and strength, an ever-present help in trouble.',              reference: 'Psalm 46:1' },
    { verse: 'Be still, and know that I am God.',                                             reference: 'Psalm 46:10' },
    { verse: 'The Lord is my strength and my shield; my heart trusts in him.',                reference: 'Psalm 28:7' },
    { verse: 'Commit your way to the Lord; trust in him and he will do this.',                reference: 'Psalm 37:5' },
    { verse: 'When I am afraid, I put my trust in you.',                                      reference: 'Psalm 56:3' },
    { verse: 'Peace I leave with you; my peace I give you.',                                  reference: 'John 14:27' },
    { verse: 'Let the peace of Christ rule in your hearts.',                                  reference: 'Colossians 3:15' },
    { verse: 'He gives strength to the weary and increases the power of the weak.',           reference: 'Isaiah 40:29' },
    { verse: 'Call to me and I will answer you and tell you great and unsearchable things.',  reference: 'Jeremiah 33:3' }
];

async function getTodaysScripture() {
    try {
        // Try Firestore first (same approach as coc-scripture-firebase.js)
        const snapshot = await db.collection('scriptures').orderBy('order').get();
        let verses = snapshot.docs.map(d => d.data());
        if (verses.length === 0) verses = FALLBACK_SCRIPTURES;

        const now          = new Date();
        const startOfYear  = new Date(now.getFullYear(), 0, 0);
        const dayOfYear    = Math.floor((now - startOfYear) / 86_400_000);
        return verses[dayOfYear % verses.length];
    } catch (err) {
        console.warn('Firestore unavailable, using fallback:', err.message);
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000);
        return FALLBACK_SCRIPTURES[dayOfYear % FALLBACK_SCRIPTURES.length];
    }
}

export default async function handler(req, res) {
    // Simple secret check so random people can't trigger mass pushes
    const secret = req.headers['x-cron-secret'] ?? req.query.secret;
    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const scripture = await getTodaysScripture();

        const payload = JSON.stringify({
            title: '📖 Scripture of the Day',
            body:  `${scripture.verse} — ${scripture.reference}`,
            icon:  '/media/logo1.png',
            badge: '/media/logo1.png',
            tag:   'daily-scripture',
            url:   '/index.html#scripture'
        });

        // Fetch all stored subscriptions
        const snapshot = await db.collection('push_subscriptions').get();
        if (snapshot.empty) {
            return res.status(200).json({ sent: 0, message: 'No subscribers yet' });
        }

        const results = await Promise.allSettled(
            snapshot.docs.map(async docSnap => {
                const { subscription } = docSnap.data();
                try {
                    await webpush.sendNotification(subscription, payload);
                    return { id: docSnap.id, status: 'sent' };
                } catch (err) {
                    // 410 Gone = subscription expired / user unsubscribed → delete it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await docSnap.ref.delete();
                        return { id: docSnap.id, status: 'removed' };
                    }
                    throw err;
                }
            })
        );

        const sent    = results.filter(r => r.status === 'fulfilled' && r.value?.status === 'sent').length;
        const removed = results.filter(r => r.status === 'fulfilled' && r.value?.status === 'removed').length;
        const failed  = results.filter(r => r.status === 'rejected').length;

        console.log(`Push scripture: sent=${sent} removed=${removed} failed=${failed}`);
        return res.status(200).json({ sent, removed, failed });

    } catch (err) {
        console.error('push-scripture error:', err);
        return res.status(500).json({ error: err.message });
    }
}