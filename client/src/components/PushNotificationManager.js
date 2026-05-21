'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, api } from '@/context/AuthContext';
import { Bell, Check } from 'lucide-react';

// Helper function to convert base64 VAPID Public key to a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [permission, setPermission] = useState('default');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    setPermission(Notification.permission);
    
    // Automatically register and check subscription if user is logged in and permission is already granted
    if (user && Notification.permission === 'granted') {
      registerAndSubscribe(false);
    }
  }, [user]);

  const registerAndSubscribe = async (showPrompt = true) => {
    if (typeof window === 'undefined') return;

    setSubscribing(true);
    try {
      // 1. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PushManager] Service Worker registered:', registration);

      // 2. Request browser permission if requested manually
      if (showPrompt && Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          setSubscribing(false);
          return;
        }
      }

      // 3. Fetch VAPID Public Key from backend
      const response = await api.get('/notifications/vapid-public-key');
      const { publicKey } = response.data;

      if (!publicKey) {
        throw new Error('VAPID Public Key was not configured on server.');
      }

      // 4. Subscribe to Push Manager
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('[PushManager] Received PushSubscription:', subscription);

      // Convert Subscription keys to format needed by web-push library
      const rawSub = JSON.parse(JSON.stringify(subscription));
      const subPayload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: rawSub.keys.p256dh,
          auth: rawSub.keys.auth
        }
      };

      // 5. Send subscription details to backend
      await api.post('/notifications/subscribe', subPayload);
      console.log('[PushManager] Subscription saved successfully on backend.');
      setPermission('granted');
    } catch (error) {
      console.error('[PushManager] Error subscribing to push:', error);
    } finally {
      setSubscribing(false);
    }
  };

  // Do not render anything for guest users
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      {permission !== 'granted' ? (
        <button
          onClick={() => registerAndSubscribe(true)}
          disabled={subscribing}
          className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4.5 rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs"
        >
          <Bell className="w-4.5 h-4.5 animate-bounce" />
          {subscribing ? 'Enabling Alerts...' : 'Enable Instant Order Alerts'}
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-slate-950/80 border border-emerald-500/30 text-emerald-400 font-semibold py-2 px-3 rounded-xl backdrop-blur-md text-[10px] uppercase tracking-wider shadow-lg">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          Order Alerts Enabled
        </div>
      )}
    </div>
  );
}
