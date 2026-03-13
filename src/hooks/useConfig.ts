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
    refetchInterval: 30_000,
  });
}

export interface RiderInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  vehicleType: string | null;
  isAvailable: boolean;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export function useRidersList() {
  return useQuery<RiderInfo[]>({
    queryKey: ['riders-list'],
    queryFn: async () => {
      const { data } = await api.get('/api/rider/list');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export interface LocationSegment {
  path: string;            // "lat,lng;lat,lng;..."
  startedAt: string;
  endedAt: string;
  intervalSeconds: number; // seconds between consecutive points
}

export interface RiderDelivery {
  id: string;
  restaurantName: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  total: number;
  deliveredAt: string;
  createdAt: string;
}

export function useRiderLocationDates(riderId: string) {
  return useQuery<string[]>({
    queryKey: ['rider-location-dates', riderId],
    queryFn: async () => {
      const { data } = await api.get(`/api/rider/${riderId}/location-history/dates`);
      return data;
    },
    enabled: !!riderId,
  });
}

export function useRiderLocationHistory(riderId: string, date: string) {
  return useQuery<LocationSegment[]>({
    queryKey: ['rider-location', riderId, date],
    queryFn: async () => {
      const { data } = await api.get(`/api/rider/${riderId}/location-history`, { params: { date } });
      return data;
    },
    enabled: !!riderId && !!date,
  });
}

export function useRiderDeliveries(riderId: string, date: string) {
  return useQuery<RiderDelivery[]>({
    queryKey: ['rider-deliveries', riderId, date],
    queryFn: async () => {
      const { data } = await api.get(`/api/rider/${riderId}/deliveries`, { params: { date } });
      return data;
    },
    enabled: !!riderId && !!date,
  });
}
