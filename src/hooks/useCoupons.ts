'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'product_pct' | 'product_fixed' | 'delivery_free';
  value: string;
  absorbsCost: 'platform' | 'shop';
  minOrderAmount: string | null;
  maxUses: number | null;
  usesCount: number;
  isActive: boolean;
  expiresAt: string | null;
  shopId: string | null;
  createdAt: string;
}

/** SA: todos los cupones */
export function useAllCoupons(enabled = true) {
  return useQuery<Coupon[]>({
    queryKey: ['coupons', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/api/coupons');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
    enabled,
  });
}

/** Admin: solo los cupones de su negocio */
export function useShopCoupons(enabled = true) {
  return useQuery<Coupon[]>({
    queryKey: ['coupons', 'shop'],
    queryFn: async () => {
      const { data } = await api.get('/api/coupons/shop');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
    enabled,
  });
}

/** SA: crear cupón de plataforma (cualquier tipo, cualquier absorbs_cost) */
export function useCreateCouponSA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      description?: string;
      type: string;
      value: number;
      absorbsCost?: string;
      minOrderAmount?: number;
      maxUses?: number;
      expiresAt?: string;
      shopId?: string;
    }) => {
      const { data } = await api.post('/api/coupons', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

/** Admin: crear cupón de negocio (solo product_pct/product_fixed, absorbs_cost siempre 'shop') */
export function useCreateCouponShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      description?: string;
      type: 'product_pct' | 'product_fixed';
      value: number;
      minOrderAmount?: number;
      maxUses?: number;
      expiresAt?: string;
    }) => {
      const { data } = await api.post('/api/coupons/shop', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

/** SA: toggle cualquier cupón */
export function useToggleCouponSA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const path = active ? 'activate' : 'deactivate';
      const { data } = await api.patch(`/api/coupons/${id}/${path}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

/** Admin: toggle cupón de su negocio */
export function useToggleCouponShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const path = active ? 'activate' : 'deactivate';
      const { data } = await api.patch(`/api/coupons/shop/${id}/${path}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}
