import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar una sola vez (Next.js hot-reload safe)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
// 2. Exportamos las herramientas de Auth para que la página las use
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

export { getToken, onMessage };
