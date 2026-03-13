'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import type { AuthResponse } from '@/models';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });

      // Login endpoint returns only accessToken in this backend
      const accessToken = data.accessToken;
      if (!accessToken) {
        throw new Error('No se recibió token de autenticación');
      }

      // Persist token in cookie so middleware can read it server-side
      document.cookie = `auth-token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

      // Fetch logged user profile using the token
      const meRes = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = meRes.data;

      setAuth(accessToken, user);
      queryClient.removeQueries({ queryKey: ['frontend-access'] });

      const isSuperAdmin = user.roles.includes('superadmin');
      const isAdmin = user.roles.includes('admin');
      if (!isSuperAdmin && !isAdmin) {
        toast.error('No tenés permisos para acceder al panel.');
        document.cookie = 'auth-token=; path=/; max-age=0';
        useAuthStore.getState().logout();
        return;
      }

      toast.success(`Bienvenido, ${user.firstName}!`);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Credenciales incorrectas';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo / Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          <span className="text-white text-2xl font-bold">Y</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">YaYa Eats</h1>
        <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              style={{ ['--tw-ring-color' as string]: '#f97316' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
                Iniciando...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Solo para administradores del sistema
      </p>
    </div>
  );
}
