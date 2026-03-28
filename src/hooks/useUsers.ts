'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User, UserRole, RiderInfo, AdminInfo } from '@/models';

export interface AdminSummary {
  id: string;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  phone: string | null;
  startedAt: string | null;
  shopId: string | null;
  shopName: string | null;
}

export function useAdminUsers() {
  return useQuery<AdminSummary[]>({
    queryKey: ['users', 'admins'],
    queryFn: async () => {
      const { data } = await api.get('/api/users/admins');
      return data;
    },
  });
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/api/users');
      return data;
    },
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roles }: { id: string; roles: UserRole[] }) => {
      const { data } = await api.put(`/api/users/${id}/roles`, { roles });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateRiderInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, info }: { id: string; info: Partial<RiderInfo> }) => {
      const { data } = await api.patch(`/api/users/${id}/rider-info`, info);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      startedAt?: string;
    }) => {
      const { data } = await api.post('/api/users', dto);
      return data as User;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUploadRiderImage() {
  return useMutation({
    mutationFn: async ({ id, type, file }: { id: string; type: 'front' | 'back'; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ url: string }>(
        `/api/users/${id}/upload-rider-image?type=${type}`,
        form,
      );
      return data.url;
    },
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; phone?: string; firstName?: string; lastName?: string }) => {
      const { data } = await api.patch(`/api/users/${id}/profile`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateAdminInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, info }: { id: string; info: Partial<AdminInfo> }) => {
      const { data } = await api.patch(`/api/users/${id}/admin-info`, info);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
