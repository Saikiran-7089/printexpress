const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@printexpress.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✔ [PushService] VAPID details set successfully.');
} else {
  console.warn('⚠ [PushService] VAPID keys are missing from .env!');
}

/**
 * Send a web push notification to all subscriptions of a specific user
 * @param {string} userId 
 * @param {string} title 
 * @param {string} body 
 * @param {string} url 
 */
async function sendPushNotification(userId, title, body, url = '/dashboard') {
  try {
    // Find all subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      console.log(`[PushService] No active push subscriptions found for user: ${userId}`);
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url
    });

    console.log(`[PushService] Attempting to send push to ${subscriptions.length} device(s) for user ${userId}...`);

    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`[PushService] Push sent successfully to endpoint: ${sub.endpoint.substring(0, 45)}...`);
      } catch (err) {
        console.error(`[PushService] Failed to send push to endpoint: ${sub.endpoint.substring(0, 45)}...`);
        // If the subscription is expired or invalid (e.g. status code 410 or 404), delete it from database
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[PushService] Subscription expired/invalid. Removing from database: ${sub.id}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`[PushService] Error in sendPushNotification:`, error);
  }
}

module.exports = {
  sendPushNotification
};
