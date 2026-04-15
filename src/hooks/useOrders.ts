'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@/models';

function normalizeOrdersResponse(data: unknown): Order[] {
  if (Array.isArray(data)) return data as Order[];
  if (data && typeof data === 'object' && Array.isArray((data as { orders?: unknown[] }).orders)) {
    return (data as { orders: unknown[] }).orders.map((o) => normalizeShopOrder(o));
  }
  return [];
}

function normalizeShopOrder(raw: unknown): Order {
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
            shopId: String(obj.shopId ?? obj.restaurantId ?? ''),
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
    shopId: String(obj.shopId ?? obj.shop_id ?? obj.restaurantId ?? obj.restaurant_id ?? ''),
    shopName: String(obj.shopName ?? obj.shop_name ?? obj.restaurantName ?? ''),
    riderId: obj.riderId ? String(obj.riderId) : undefined,
    status: String(obj.status ?? 'pendiente') as OrderStatus,
    deliveryType: String(obj.deliveryType ?? 'delivery') as 'delivery' | 'recogida' | 'express',
    deliveryAddress: String(obj.deliveryAddress ?? ''),
    deliveryLat: Number(obj.deliveryLat ?? 0),
    deliveryLng: Number(obj.deliveryLng ?? 0),
    subtotal: Number(obj.subtotal ?? 0),
    total: Number(obj.total ?? 0),
    deliveryFee: Number(obj.deliveryFee ?? obj.delivery_fee ?? 0),
    platformFee: Number(obj.platformFee ?? obj.platform_fee ?? 0),
    commissionAmount: Number(obj.commissionAmount ?? obj.commission_amount ?? 0),
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
    items,
    groupId: obj.groupId ? String(obj.groupId) : undefined,
    paymentProofUrl: obj.paymentProofUrl ?? obj.payment_proof_url ?? null,
    paymentMethod: String(obj.paymentMethod ?? obj.payment_method ?? 'qr'),
    paidAt: obj.paidAt ?? obj.paid_at ?? null,
    createdAt: String(obj.createdAt ?? new Date().toISOString()),
    updatedAt: String(obj.updatedAt ?? obj.createdAt ?? new Date().toISOString()),
  };
}

export function useOrders(options?: { enabled?: boolean }) {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders/shop/mine');
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
      return Array.isArray(data) ? data.map(normalizeShopOrder) : [];
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
        return normalizeShopOrder(data);
      } catch (error: unknown) {
        const status =
          (error as { response?: { status?: number } })?.response?.status;

        // shop_owner can't access /orders/:id in backend; fallback to shop list
        if (status === 404 || status === 403) {
          const { data } = await api.get('/api/orders/shop/mine');
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

export function useMarkLocalDelivered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/orders/${id}/deliver`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
}

export interface AreaKindOption {
  value: string;
  label: string;
  type: 'mesa' | 'zona' | 'seccion';
  webIcon: string | null;
  color: string;
  sortOrder: number;
}

export function useAreaKindOptions() {
  return useQuery<AreaKindOption[]>({
    queryKey: ['area-kind-options'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders/shop/local/area-kind-options');
      return Array.isArray(data) ? data : [];
    },
    staleTime: Infinity,
  });
}

export interface ShopServiceArea {
  id: string;
  shopId: string;
  name: string;
  kind: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateLocalCashOrderPayload {
  serviceType: 'local' | 'recogida';
  areaId?: string;
  areaLabel?: string;
  notes?: string;
  items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
}

export function useShopServiceAreas(shopId: string) {
  return useQuery<ShopServiceArea[]>({
    queryKey: ['shop-service-areas', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/shop/${shopId}/local/areas`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!shopId,
    staleTime: 30_000,
  });
}

export function useCreateShopServiceArea(shopId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: { name: string; kind?: string; color?: string }) => {
      const { data } = await api.post(`/api/orders/shop/${shopId}/local/areas`, body);
      return data as ShopServiceArea;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-service-areas', shopId] });
    },
  });
}

export function useCreateLocalCashOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateLocalCashOrderPayload) => {
      const { data } = await api.post('/api/orders/shop/local/cash', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['shop-service-areas'] });
      qc.invalidateQueries({ queryKey: ['my-shop'] });
    },
  });
}

export function useManualConfirmPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/orders/${id}/confirm-manual`, {});
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

export function useRejectPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.post(`/api/orders/${id}/reject-payment`, { reason });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', variables.id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}
