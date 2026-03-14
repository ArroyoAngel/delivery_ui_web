'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@/models';

function normalizeOrdersResponse(data: unknown): Order[] {
  if (Array.isArray(data)) return data as Order[];
  if (data && typeof data === 'object' && Array.isArray((data as { orders?: unknown[] }).orders)) {
    return (data as { orders: unknown[] }).orders.map((o) => normalizeRestaurantOrder(o));
  }
  return [];
}

function normalizeRestaurantOrder(raw: unknown): Order {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(obj.items)
    ? obj.items.map((it, idx) => {
        const item = it as Record<string, unknown>;
        const menu_item_id = String(item.menu_item_id ?? item.menuItemId ?? '');
        const item_name = String(item.item_name ?? item.name ?? 'Producto');
        const unit_price = Number(item.unit_price ?? item.unitPrice ?? 0);
        return {
          id: String(item.id ?? `${String(obj.id ?? 'order')}-${idx}`),
          order_id: String(obj.id ?? ''),
          menu_item_id,
          item_name,
          unit_price,
          description: '',
          image_url: String(item.image_url ?? ''),
          quantity: Number(item.quantity ?? 0),
          notes: typeof item.notes === 'string' ? item.notes : undefined,
          menuItem: {
            id: menu_item_id,
            restaurantId: String(obj.restaurantId ?? ''),
            categoryId: '',
            name: item_name,
            description: '',
            price: unit_price,
            imageUrl: String(item.image_url ?? ''),
            isAvailable: true,
            preparationTimeMin: 0,
            createdAt: String(obj.createdAt ?? new Date().toISOString()),
          },
        };
      })
    : [];

  return {
    id: String(obj.id ?? ''),
    clientId: String(obj.clientId ?? obj.client_id ?? ''),
    clientName: String(obj.clientName ?? ''),
    restaurantId: String(obj.restaurantId ?? obj.restaurant_id ?? ''),
    restaurantName: String(obj.restaurantName ?? ''),
    riderId: obj.riderId ? String(obj.riderId) : undefined,
    status: String(obj.status ?? 'pendiente') as OrderStatus,
    deliveryType: String(obj.deliveryType ?? 'delivery') as 'delivery' | 'recogida' | 'express',
    deliveryAddress: String(obj.deliveryAddress ?? ''),
    deliveryLat: Number(obj.deliveryLat ?? 0),
    deliveryLng: Number(obj.deliveryLng ?? 0),
    total: Number(obj.total ?? 0),
    deliveryFee: Number(obj.deliveryFee ?? 0),
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
    items,
    groupId: obj.groupId ? String(obj.groupId) : undefined,
    createdAt: String(obj.createdAt ?? new Date().toISOString()),
    updatedAt: String(obj.updatedAt ?? obj.createdAt ?? new Date().toISOString()),
  };
}

export function useOrders(options?: { enabled?: boolean }) {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders/restaurant/mine');
      return normalizeOrdersResponse(data);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAdminOrders(options?: { enabled?: boolean }) {
  return useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders/admin/all');
      return Array.isArray(data) ? data.map(normalizeRestaurantOrder) : [];
    },
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['orders', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/orders/${id}`);
        return data;
      } catch (error: unknown) {
        const status =
          (error as { response?: { status?: number } })?.response?.status;

        // restaurant_owner can't access /orders/:id in backend; fallback to restaurant list
        if (status === 404 || status === 403) {
          const { data } = await api.get('/api/orders/restaurant/mine');
          const orders = normalizeOrdersResponse(data);
          const found = orders.find((o) => o.id === id);
          if (found) return found;
        }
        throw error;
      }
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data } = await api.put(`/api/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', variables.id] });
    },
  });
}

export function useMarkPreparing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/orders/${id}/preparing`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
}

export function useMarkReady() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/orders/${id}/ready`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
}
