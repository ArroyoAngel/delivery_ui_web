'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order, OrderStatus } from '@/models';

function normalizeOrder(raw: unknown): Order {
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
          image_url: String(item.image_url ?? item.imageUrl ?? ''),
          quantity: Number(item.quantity ?? 0),
          notes: typeof item.notes === 'string' ? item.notes : undefined,
          menuItem: {
            id: menu_item_id,
            restaurantId: String(obj.restaurantId ?? obj.restaurant_id ?? ''),
            categoryId: String(item.categoryId ?? item.category_id ?? ''),
            name: item_name,
            description: '',
            price: unit_price,
            imageUrl: String(item.image_url ?? item.imageUrl ?? ''),
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
    restaurantId: String(obj.restaurantId ?? obj.restaurant_id ?? ''),
    riderId: obj.riderId ?? obj.rider_id ? String(obj.riderId ?? obj.rider_id) : undefined,
    status: String(obj.status ?? 'pendiente') as OrderStatus,
    deliveryType: String(obj.deliveryType ?? obj.delivery_type ?? 'delivery') as Order['deliveryType'],
    deliveryAddress: String(obj.deliveryAddress ?? obj.delivery_address ?? ''),
    deliveryLat: Number(obj.deliveryLat ?? obj.delivery_lat ?? 0),
    deliveryLng: Number(obj.deliveryLng ?? obj.delivery_lng ?? 0),
    total: Number(obj.total ?? 0),
    deliveryFee: Number(obj.deliveryFee ?? obj.delivery_fee ?? 0),
    notes: typeof obj.notes === 'string' ? obj.notes : undefined,
    items,
    groupId: obj.groupId ?? obj.group_id ? String(obj.groupId ?? obj.group_id) : undefined,
    createdAt: String(obj.createdAt ?? obj.created_at ?? new Date().toISOString()),
    updatedAt: String(obj.updatedAt ?? obj.updated_at ?? obj.createdAt ?? new Date().toISOString()),
  };
}

export function useAllOrders() {
  return useQuery<Order[]>({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data } = await api.get('/api/orders/admin/all');
      if (Array.isArray(data)) return data.map(normalizeOrder);
      if (data && typeof data === 'object') {
        const wrapper = data as { orders?: unknown[]; data?: unknown[] };
        const list = wrapper.orders ?? wrapper.data;
        if (Array.isArray(list)) return list.map(normalizeOrder);
      }
      return [];
    },
    staleTime: 30_000,
  });
}
