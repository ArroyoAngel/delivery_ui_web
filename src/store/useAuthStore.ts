'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/models';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
  isShopOwner: () => boolean;
  canManageShop: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => !!get().token,
      isSuperAdmin: () =>
        (get().user?.roles.includes('superadmin')) ?? false,
      isShopOwner: () => {
        const roles = get().user?.roles ?? [];
        return (
          roles.includes('admin') &&
          !roles.includes('superadmin')
        );
      },
      canManageShop: () => {
        const roles = get().user?.roles ?? [];
        return roles.some((r) =>
          ['admin', 'superadmin'].includes(r),
        );
      },
    }),
    { name: 'auth-storage' }
  )
);
