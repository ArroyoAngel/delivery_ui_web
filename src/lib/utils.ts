import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OrderStatus, DeliveryType, UserRole, GroupStatus } from '@/models';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  listo: 'Listo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  preparando: 'bg-purple-100 text-purple-800',
  listo: 'bg-indigo-100 text-indigo-800',
  en_camino: 'bg-orange-100 text-orange-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  delivery: 'Delivery',
  recogida: 'Recogida',
  express: 'Express',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Cliente',
  restaurant_owner: 'Restaurante',
  rider: 'Repartidor',
  super_admin: 'Super Admin',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  client: 'bg-gray-100 text-gray-700',
  restaurant_owner: 'bg-blue-100 text-blue-700',
  rider: 'bg-green-100 text-green-700',
  super_admin: 'bg-red-100 text-red-700',
};

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  available: 'Disponible',
  assigned: 'Asignado',
  in_progress: 'En progreso',
  completed: 'Completado',
};

export const GROUP_STATUS_COLORS: Record<GroupStatus, string> = {
  available: 'bg-green-100 text-green-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-gray-100 text-gray-700',
};

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function truncate(str: string, length = 40): string {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}
