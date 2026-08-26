'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  createdAt: string;
}

export function useZones() {
  return useQuery<DeliveryZone[]>({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data } = await api.get('/api/zones');
      return data;
    },
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<DeliveryZone, 'id' | 'createdAt'>) => {
      const { data } = await api.post('/api/zones', dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<DeliveryZone> & { id: string }) => {
      const { data } = await api.patch(`/api/zones/${id}`, dto);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/zones/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });
}
