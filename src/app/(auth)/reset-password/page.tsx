'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';

type Step = 'email' | 'code';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!email) { toast.error('Ingresa tu correo electrónico'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password/send-otp', { email });
      toast.success(`Código enviado a ${email}`);
      setStep('code');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo enviar el código';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) { toast.error('Ingresa el código de 6 dígitos'); return; }
    if (newPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { email, code, newPassword });
      toast.success('Contraseña actualizada. Inicia sesión.');
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Código incorrecto o expirado';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <span className="text-white text-2xl font-bold">Y</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">YaYa Eats</h1>
        <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Recuperar contraseña</h2>
        <p className="text-sm text-gray-500 mb-6">
          {step === 'email'
            ? 'Te enviaremos un código de verificación a tu correo.'
            : `Ingresa el código enviado a ${email} y tu nueva contraseña.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yayaeats.com"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: loading ? '#f9a26b' : '#f97316' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </span>
              ) : (
                'Enviar código'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Email readonly */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Código de verificación
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all tracking-widest font-mono"
              />
              <button
                type="button"
                onClick={() => { setLoading(true); api.post('/api/auth/reset-password/send-otp', { email }).then(() => toast.success('Código reenviado')).catch(() => toast.error('No se pudo reenviar')).finally(() => setLoading(false)); }}
                className="mt-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Reenviar código
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: loading ? '#f9a26b' : '#f97316' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Actualizando...
                </span>
              ) : (
                'Cambiar contraseña'
              )}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
