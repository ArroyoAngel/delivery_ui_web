'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { SystemConfig, DeliveryGroup } from '@/models';

export function useSystemConfig() {
  return useQuery<SystemConfig[]>({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data } = await api.get('/api/config');
      return data;
    },
  });
}

export function useUpdateSystemConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data } = await api.put(`/api/config/${key}`, { value });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-config'] });
    },
  });
}

export function useDeliveryGroups() {
  return useQuery<DeliveryGroup[]>({
    queryKey: ['delivery-groups'],
    queryFn: async () => {
      const { data } = await api.get('/api/rider/groups/available');
      return data;
    },
    refetchInterval: 30_000, // poll every 30s
  });
}
