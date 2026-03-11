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
