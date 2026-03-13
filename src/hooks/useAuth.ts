'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Devuelve las rutas de frontend que el usuario actual tiene permitidas,
 * según las reglas casbin almacenadas en la base de datos (v4='frontend').
 */
export function useFrontendAccess() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return useQuery<string[]>({
    queryKey: ['frontend-access'],
    queryFn: async () => {
      const { data } = await api.get('/api/auth/frontend-access');
      return data as string[];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos — no re-fetch por cada navegación
  });
}
