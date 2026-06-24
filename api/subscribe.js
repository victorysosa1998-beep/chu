/**
 * POST /api/subscribe
 * Saves a browser PushSubscription to Firestore so the cron job can push to it.
 * Body: { subscription: PushSubscription JSON }
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Initialise Firebase Admin once
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

export default async function handler(req, res) {
    // CORS – allow your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { subscription } = req.body;

        if (!subscription?.endpoint) {
            return res.status(400).json({ error: 'Invalid subscription object' });
        }

        // Use endpoint as document ID (it's unique per browser/device)
        const id = Buffer.from(subscription.endpoint).toString('base64').slice(0, 100);

        await db.collection('push_subscriptions').doc(id).set({
            subscription,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('subscribe error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}