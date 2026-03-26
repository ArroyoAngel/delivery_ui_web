'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Shop, ShopDetail, ShopCategory } from '@/models';

export function useShops(search?: string, categoryId?: string) {
  return useQuery<Shop[]>({
    queryKey: ['shops', search, categoryId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      const { data } = await api.get('/api/shops', { params });
      return data;
    },
  });
}

export function useShop(id: string) {
  return useQuery<ShopDetail>({
    queryKey: ['shops', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/shops/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useMyShop() {
  return useQuery<ShopDetail | null>({
    queryKey: ['my-shop'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/api/shops/mine');
        return data;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });
}

export function useShopCategories() {
  return useQuery<ShopCategory[]>({
    queryKey: ['shop-categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/shops/categories');
      return data;
    },
  });
}

export function useToggleShopOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isOpen }: { id: string; isOpen: boolean }) => {
      const { data } = await api.patch(`/api/shops/${id}`, { isOpen });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}

export function useToggleShopStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'disabled' }) => {
      const { data } = await api.patch(`/api/shops/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}

export function useUpdateMenuItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopId,
      itemId,
      isAvailable,
    }: {
      shopId: string;
      itemId: string;
      isAvailable: boolean;
    }) => {
      const { data } = await api.patch(`/api/shops/${shopId}/menu/${itemId}`, {
        isAvailable,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shops', variables.shopId] });
    },
  });
}

export function useCreateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, name }: { shopId: string; name: string }) => {
      const { data } = await api.post(`/api/shops/${shopId}/menu/categories`, { name });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shops', variables.shopId] });
      qc.invalidateQueries({ queryKey: ['my-shop'] });
    },
  });
}

export function useShopStaff(shopId: string) {
  return useQuery({
    queryKey: ['shop-staff', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/shops/${shopId}/staff`);
      return data as import('@/models').ShopStaff[];
    },
    enabled: !!shopId,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopId,
      ...body
    }: {
      shopId: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleName: string;
      permissions: string[];
    }) => {
      const { data } = await api.post(`/api/shops/${shopId}/staff`, body);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shop-staff', variables.shopId] });
    },
  });
}

export function useUpdateStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopId,
      staffId,
      permissions,
    }: {
      shopId: string;
      staffId: string;
      permissions: string[];
    }) => {
      const { data } = await api.patch(`/api/shops/${shopId}/staff/${staffId}`, { permissions });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shop-staff', variables.shopId] });
    },
  });
}

export function useRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, staffId }: { shopId: string; staffId: string }) => {
      const { data } = await api.delete(`/api/shops/${shopId}/staff/${staffId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shop-staff', variables.shopId] });
    },
  });
}

export function useUploadShopQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, file }: { shopId: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string }>(`/api/shops/${shopId}/upload-qr`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-shop'] });
    },
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopId,
      ...body
    }: {
      shopId: string;
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
      stock?: number | null;
      dailyLimit?: number | null;
      size?: number;
    }) => {
      const { data } = await api.post(`/api/shops/${shopId}/menu`, body);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['shops', variables.shopId] });
      qc.invalidateQueries({ queryKey: ['my-shop'] });
    },
  });
}
