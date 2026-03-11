'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AdminStats {
  total: number;
  ordersToday: number;
  revenueToday: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders/admin/stats');
      return data;
    },
    refetchInterval: 60_000,
  });
}
