const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Expose public VAPID key dynamically to the frontend
router.get('/vapid-public-key', (req, res) => {
  return res.status(200).json({ 
    publicKey: process.env.VAPID_PUBLIC_KEY || ''
  });
});

// Subscribe user device
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Missing required subscription fields.' });
    }

    const userId = req.user.id;

    // Upsert subscription (unique endpoint)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    console.log(`[NotificationRoutes] Push subscription registered for user ${userId}: ${endpoint.substring(0, 45)}...`);

    return res.status(201).json({ 
      message: 'Successfully subscribed to push notifications!',
      subscription 
    });
  } catch (error) {
    console.error('[NotificationRoutes.subscribe] Error:', error);
    return res.status(500).json({ error: 'Failed to save push subscription.' });
  }
});

module.exports = router;
