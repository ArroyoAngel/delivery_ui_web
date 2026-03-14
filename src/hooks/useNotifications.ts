'use client';

import { useEffect } from 'react';
import { getFirebaseMessaging, getToken, onMessage } from '@/lib/firebase';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    async function setup() {
      try {
        // Registrar el service worker
        const swRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
        );

        // Enviarle la config de Firebase al SW
        const config = {
          apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        swRegistration.active?.postMessage({ type: 'FIREBASE_CONFIG', config });

        // Solicitar permiso y obtener token
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging!, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });

        if (token) {
          await api.post('/api/notifications/token', { token, platform: 'web' });
        }

        // Notificaciones en foreground — mostrar como toast
        onMessage(messaging!, (payload) => {
          const title = payload.notification?.title ?? 'YaYa Eats';
          const body  = payload.notification?.body  ?? '';
          toast(`${title}\n${body}`, { duration: 6000 });
        });
      } catch {
        // Firebase no configurado o sin permisos — silencioso
      }
    }

    setup();
  }, []);
}
