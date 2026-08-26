// ─── User ────────────────────────────────────────────────────────────────────
export type UserRole =
  | 'client'
  | 'rider'
  | 'superadmin'
  | 'admin';

export type VehicleType = 'moto' | 'auto' | 'bici';

export interface RiderInfo {
  vehicleType: VehicleType | null;
  licenseFrontUrl: string | null;
  licenseBackUrl: string | null;
  plate: string | null;
  policyUrl: string | null;
  vin: string | null;
}

export interface AdminInfo {
  startedAt: string | null;
}

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
  riderInfo?: RiderInfo | null;
  adminInfo?: AdminInfo | null;
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

// ─── Shop ───────────────────────────────────────────────────────────────────
export interface ShopCategory {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  businessTypeId: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  rating: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  status: 'active' | 'disabled';
  openingTime?: string | null;
  closingTime?: string | null;
  businessTypeId: string;
  serviceCategory?: string;
  qrImageUrl?: string | null;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  shopId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  shopId: string;
  categoryId: string;
  category?: MenuCategory;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  preparationTimeMin: number;
  stock?: number | null;
  dailyLimit?: number | null;
  dailySold?: number;
  createdAt: string;
  categoryIds?: string[];
}

export interface ShopDetail extends Shop {
  menuCategories: (MenuCategory & { items: MenuItem[] })[];
  assignedCategoryIds?: string[];
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
  order_id: string;
  menu_item_id: string;
  item_name: string;
  menuItem?: MenuItem;
  quantity: number;
  unit_price: number;
  notes?: string;
  description: string;
  image_url?: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName?: string;
  client?: User;
  shopId: string;
  shopName?: string;
  shop?: Shop;
  riderId?: string;
  rider?: User;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  subtotal: number;
  total: number;
  deliveryFee: number;
  platformFee: number;
  commissionAmount: number;
  notes?: string;
  isExpress?: boolean;
  items?: OrderItem[];
  groupId?: string;
  paymentProofUrl?: string | null;
  paymentMethod?: string;
  paidAt?: string | null;
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
  totalShops: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

// ─── Shop Staff ─────────────────────────────────────────────────────────────
export const STAFF_PERMISSIONS = [
  'manage_menu',
  'manage_orders',
  'view_orders',
  'manage_schedule',
  'manage_restaurant',
  'manage_staff',
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export const STAFF_PERMISSION_LABELS: Record<StaffPermission, string> = {
  manage_menu:       'Gestionar menú',
  manage_orders:     'Gestionar órdenes',
  view_orders:       'Ver órdenes (solo lectura)',
  manage_schedule:   'Gestionar horarios',
  manage_restaurant: 'Editar datos del negocio',
  manage_staff:      'Gestionar personal',
};

/** Nombres de cargo que están reservados para roles del sistema */
export const RESERVED_ROLE_NAMES = [
  'administrador', 'admin', 'superadmin', 'superadministrador',
  'super admin', 'super administrador', 'dueño', 'propietario',
  'owner', 'root',
] as const;

export interface ShopStaff {
  id: string;
  accountId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleName: string;
  permissions: StaffPermission[];
  createdAt: string;
  /** true cuando el superadmin lista el personal e incluye al propietario del negocio */
  isOwner?: boolean;
}
