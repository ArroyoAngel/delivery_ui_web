'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RolePermissions {
  role: string;
  routes: string[];
}

export function useRolePermissions() {
  return useQuery<RolePermissions[]>({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data } = await api.get('/api/roles/permissions');
      return data;
    },
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, routes }: { role: string; routes: string[] }) => {
      const { data } = await api.put(`/api/roles/${role}/permissions`, { routes });
      return data as RolePermissions;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role-permissions'] });
    },
  });
}
