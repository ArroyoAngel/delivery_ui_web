// ─── User ────────────────────────────────────────────────────────────────────
export type UserRole = 'client' | 'restaurant_owner' | 'rider' | 'super_admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: UserRole[];
  googleId?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

// ─── Restaurant ───────────────────────────────────────────────────────────────
export interface RestaurantCategory {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  category?: RestaurantCategory;
  imageUrl: string;
  rating: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  category?: MenuCategory;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  preparationTimeMin: number;
  createdAt: string;
}

export interface RestaurantDetail extends Restaurant {
  menuCategories: (MenuCategory & { items: MenuItem[] })[];
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export type DeliveryType = 'delivery' | 'recogida' | 'express';

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  clientId: string;
  client?: User;
  restaurantId: string;
  restaurant?: Restaurant;
  riderId?: string;
  rider?: User;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  total: number;
  deliveryFee: number;
  notes?: string;
  isExpress?: boolean;
  items?: OrderItem[];
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Delivery Groups ──────────────────────────────────────────────────────────
export type GroupStatus = 'available' | 'assigned' | 'in_progress' | 'completed';

export interface DeliveryGroup {
  id: string;
  riderId?: string;
  rider?: User;
  status: GroupStatus;
  orders?: Order[];
  createdAt: string;
  updatedAt: string;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  userId: string;
  name: string;
  street: string;
  number: string;
  floor?: string;
  reference?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

// ─── System Config ────────────────────────────────────────────────────────────
export interface SystemConfig {
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

// ─── Stats / Dashboard ────────────────────────────────────────────────────────
export interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  activeRiders: number;
  totalRestaurants: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
}
