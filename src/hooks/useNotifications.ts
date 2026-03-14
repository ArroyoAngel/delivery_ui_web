'use client';

import { useEffect } from 'react';
import { getFirebaseMessaging, getToken, onMessage } from '@/lib/firebase';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useNotifications() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Solo registrar cuando el usuario está autenticado
    if (!token) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    async function setup() {
      try {
        const swRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
        );

        const config = {
          apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        swRegistration.active?.postMessage({ type: 'FIREBASE_CONFIG', config });

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const fcmToken = await getToken(messaging!, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });

        if (fcmToken) {
          await api.post('/api/notifications/token', { token: fcmToken, platform: 'web' });
        }

        // Notificaciones en foreground — mostrar como toast
        const unsub = onMessage(messaging!, (payload) => {
          const title = payload.notification?.title ?? 'YaYa Eats';
          const body  = payload.notification?.body  ?? '';
          toast(`${title}\n${body}`, { duration: 6000 });
        });

        return unsub;
      } catch {
        // Firebase no configurado o sin permisos — silencioso
      }
    }

    let cleanup: (() => void) | undefined;
    setup().then((unsub) => { cleanup = unsub; });
    return () => { cleanup?.(); };
  }, [token]); // Re-ejecuta cuando el usuario se autentica
}
