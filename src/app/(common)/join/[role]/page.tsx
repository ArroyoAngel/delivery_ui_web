'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { app } from '@/lib/firebase';

type RoleKey = 'client' | 'rider' | 'restaurant' | 'admin';

const ROLE_CONFIG: Record<RoleKey, { label: string; color: string }> = {
  client:     { label: 'Cliente',               color: '#FF6B00' },
  rider:      { label: 'Rider / Delivery',      color: '#2563EB' },
  restaurant: { label: 'Restaurante / Partner', color: '#D4AF37' },
  admin:      { label: 'Administrador',         color: '#1a1a2e' },
};

const WA_NUMBER = '59173666496';

function buildWaMessage(label: string, name: string, email: string) {
  const lines = [
    `*Solicitud Beta – YaYa! Eats*`,
    `Rol: ${label}`,
    `Nombre: ${name}`,
    `Correo: ${email}`,
  ];
  
  return encodeURIComponent(lines.join('\n'));
}

export default function JoinPage() {
  const params = useParams();
  const role = params?.role as string;
  const config = ROLE_CONFIG[role as RoleKey];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Página no encontrada.</p>
      </div>
    );
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const { getAuth, GoogleAuthProvider, signInWithPopup, signOut } = await import('firebase/auth');
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const { displayName, email: googleEmail } = result.user;
      
      await signOut(auth);

      const message = buildWaMessage(config.label, displayName ?? '', googleEmail ?? '');
      
      const isMobile = /iPhone|Android|iPad|iPod/i.test(navigator.userAgent);
      
      if (isMobile) {
        window.location.href = `whatsapp://send?phone=${WA_NUMBER}&text=${message}`;
      } else {
        window.open(`https://wa.me/${WA_NUMBER}?text=${message}`, '_blank');
      }

      setSent(true);
    } catch (error) {
      console.error("Error en Google Sign-In:", error);
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const message = buildWaMessage(config.label, name.trim(), email.trim());
    
    const isMobile = /iPhone|Android|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${WA_NUMBER}&text=${message}`;
    } else {
      window.open(`https://wa.me/${WA_NUMBER}?text=${message}`, '_blank');
    }
    
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <div
          className="inline-block bg-white px-6 py-3 rounded-full font-black text-3xl tracking-tighter shadow-lg border-b-4 border-black/10"
          style={{ transform: 'skewX(-3deg)' }}
        >
          <span style={{ color: '#FF6B00' }}>YaYa!</span>{' '}
          <span className="text-gray-800">Eats</span>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        {sent ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold"
              style={{ backgroundColor: config.color }}
            >
              ✓
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
            <p className="text-gray-500 text-sm">
              Se abrió WhatsApp con tu información. En breve nos ponemos en contacto contigo.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 text-center">
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white mb-3"
                style={{ backgroundColor: config.color }}
              >
                {config.label}
              </span>
              <h1 className="text-xl font-bold text-gray-900">Únete a la Beta</h1>
              <p className="text-sm text-gray-400 mt-1">
                Completa tus datos y te contactamos pronto.
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              )}
              <span className="ml-2 font-medium">Continuar con Google</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">o ingresa tus datos</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Correo electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: config.color }}
              >
                <Send size={15} />
                Enviar por WhatsApp
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © 2026 YaYa! Eats · Santa Cruz, Bolivia
      </p>
    </div>
  );
}