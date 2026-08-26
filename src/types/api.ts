/**
 * Raw types from backend API responses
 * These represent the exact structure returned by the server
 */

export type RawShopCategory = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  business_type_id: string;
};

export type RawOrderItem = {
  id?: string;
  order_id?: string;
  orderId?: string;
  menu_item_id?: string;
  menuItemId?: string;
  item_name?: string;
  itemName?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
  unitPrice?: number;
  notes?: string;
  description?: string;
  image_url?: string;
  imageUrl?: string;
  menuItem?: Record<string, unknown>;
};

export type RawOrder = {
  id?: string;
  client_id?: string;
  clientId?: string;
  client_name?: string;
  clientName?: string;
  shop_id?: string;
  shopId?: string;
  restaurant_id?: string;
  restaurantId?: string;
  shop_name?: string;
  shopName?: string;
  restaurant_name?: string;
  restaurantName?: string;
  rider_id?: string | null;
  riderId?: string | null;
  status?: string;
  delivery_type?: string;
  deliveryType?: string;
  delivery_address?: string | null;
  deliveryAddress?: string | null;
  delivery_lat?: string | number | null;
  deliveryLat?: string | number | null;
  delivery_lng?: string | number | null;
  deliveryLng?: string | number | null;
  subtotal?: string | number;
  total?: string | number;
  delivery_fee?: string | number;
  deliveryFee?: string | number;
  platform_fee?: string | number;
  platformFee?: string | number;
  commission_amount?: string | number;
  commissionAmount?: string | number;
  notes?: string | null;
  group_id?: string | null;
  groupId?: string | null;
  payment_method?: string;
  paymentMethod?: string;
  payment_proof_url?: string | null;
  paymentProofUrl?: string | null;
  paid_at?: string | Date | null;
  paidAt?: string | Date | null;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date;
  updatedAt?: string | Date;
  items?: RawOrderItem[];
};
