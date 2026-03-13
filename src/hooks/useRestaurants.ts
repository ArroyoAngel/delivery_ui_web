'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Restaurant, RestaurantDetail, RestaurantCategory } from '@/models';

export function useRestaurants(search?: string, categoryId?: string) {
  return useQuery<Restaurant[]>({
    queryKey: ['restaurants', search, categoryId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      const { data } = await api.get('/api/restaurants', { params });
      return data;
    },
  });
}

export function useRestaurant(id: string) {
  return useQuery<RestaurantDetail>({
    queryKey: ['restaurants', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useMyRestaurant() {
  return useQuery<RestaurantDetail>({
    queryKey: ['my-restaurant'],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurants/mine');
      return data;
    },
  });
}

export function useRestaurantCategories() {
  return useQuery<RestaurantCategory[]>({
    queryKey: ['restaurant-categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurants/categories');
      return data;
    },
  });
}

export function useToggleRestaurantOpen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isOpen }: { id: string; isOpen: boolean }) => {
      const { data } = await api.patch(`/api/restaurants/${id}`, { isOpen });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useUpdateMenuItemAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      itemId,
      isAvailable,
    }: {
      restaurantId: string;
      itemId: string;
      isAvailable: boolean;
    }) => {
      const { data } = await api.patch(`/api/restaurants/${restaurantId}/menu/${itemId}`, {
        isAvailable,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['restaurants', variables.restaurantId] });
    },
  });
}

export function useCreateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, name }: { restaurantId: string; name: string }) => {
      const { data } = await api.post(`/api/restaurants/${restaurantId}/menu/categories`, { name });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['restaurants', variables.restaurantId] });
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
    },
  });
}

export function useRestaurantStaff(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant-staff', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${restaurantId}/staff`);
      return data as import('@/models').RestaurantStaff[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      ...body
    }: {
      restaurantId: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleName: string;
      permissions: string[];
    }) => {
      const { data } = await api.post(`/api/restaurants/${restaurantId}/staff`, body);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['restaurant-staff', variables.restaurantId] });
    },
  });
}

export function useUpdateStaffPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      staffId,
      permissions,
    }: {
      restaurantId: string;
      staffId: string;
      permissions: string[];
    }) => {
      const { data } = await api.patch(`/api/restaurants/${restaurantId}/staff/${staffId}`, { permissions });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['restaurant-staff', variables.restaurantId] });
    },
  });
}

export function useRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ restaurantId, staffId }: { restaurantId: string; staffId: string }) => {
      const { data } = await api.delete(`/api/restaurants/${restaurantId}/staff/${staffId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['restaurant-staff', variables.restaurantId] });
    },
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      ...body
    }: {
      restaurantId: string;
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
      const { data } = await api.post(`/api/restaurants/${restaurantId}/menu`, body);
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['restaurants', variables.restaurantId] });
      qc.invalidateQueries({ queryKey: ['my-restaurant'] });
    },
  });
}
