'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface SupportTicket {
  id: string;
  accountId: string | null;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  email?: string | null;
}

/** SA: todos los tickets */
export function useAllTickets(limit = 100, status?: string) {
  return useQuery<SupportTicket[]>({
    queryKey: ['support-tickets', 'all', limit, status],
    queryFn: async () => {
      const { data } = await api.get('/api/support/admin/tickets', {
        params: { limit, ...(status ? { status } : {}) },
      });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

/** Admin/negocio: mis propios tickets */
export function useMyTickets() {
  return useQuery<SupportTicket[]>({
    queryKey: ['support-tickets', 'mine'],
    queryFn: async () => {
      const { data } = await api.get('/api/support/tickets');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

/** Crear un ticket de soporte */
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subject: string; message: string }) => {
      const { data } = await api.post('/api/support/tickets', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets', 'mine'] });
    },
  });
}

/** SA: actualizar estado/notas de un ticket */
export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      status: string;
      adminNotes?: string;
    }) => {
      const { id, ...body } = payload;
      const { data } = await api.patch(`/api/support/admin/tickets/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}
