'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChefHat } from 'lucide-react';
import { useOrders, useAdminOrders } from '@/hooks/useOrders';
import { useOrdersSocket } from '@/hooks/useOrdersSocket';
import { useAuthStore } from '@/store/useAuthStore';
import KitchenView from '@/components/KitchenView';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_TYPE_LABELS,
} from '@/lib/utils';
import type { Order, OrderStatus } from '@/models';

const ALL_STATUSES: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'preparando', label: 'Preparando' },
  { value: 'listo', label: 'Listo' },
  { value: 'en_camino', label: 'En camino' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles.includes('superadmin') ?? false;
  const hasUser = !!user;

  useOrdersSocket();

  const restaurantOrders = useOrders({ enabled: hasUser && !isAdmin });
  const adminOrders = useAdminOrders({ enabled: hasUser && isAdmin });

  const orders = isAdmin ? adminOrders.data : restaurantOrders.data;
  const isLoading = isAdmin ? adminOrders.isLoading : restaurantOrders.isLoading;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [kitchenOpen, setKitchenOpen] = useState(false);

  const filtered = (orders ?? []).filter((o) => {
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.deliveryAddress?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (o.shopName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (o.clientName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchStatus && matchSearch;
  });

  const baseColumns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Pedido',
      render: (o) => (
        <span className="font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</span>
      ),
    },
    {
      key: 'deliveryType',
      label: 'Tipo',
      render: (o) => (
        <span className="capitalize text-gray-700">
          {DELIVERY_TYPE_LABELS[o.deliveryType] ?? o.deliveryType}
        </span>
      ),
    },
    {
      key: 'deliveryAddress',
      label: 'Dirección',
      render: (o) => (
        <span className="text-gray-600 text-xs max-w-[180px] block truncate">
          {o.deliveryAddress || '—'}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (o) => (
        <span className="font-semibold text-gray-900">{formatCurrency(Number(o.total))}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (o) => (
        <Badge
          label={ORDER_STATUS_LABELS[o.status]}
          className={ORDER_STATUS_COLORS[o.status]}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (o) => (
        <span className="text-gray-500 text-xs">{formatDate(o.createdAt)}</span>
      ),
    },
  ];

  const adminExtraColumns: Column<Order>[] = [
    {
      key: 'shopName' as keyof Order,
      label: 'Negocio',
      render: (o) => (
        <span className="text-gray-700 text-sm font-medium">{o.shopName || '—'}</span>
      ),
    },
    {
      key: 'clientName' as keyof Order,
      label: 'Cliente',
      render: (o) => (
        <span className="text-gray-600 text-sm">{o.clientName || '—'}</span>
      ),
    },
  ];

  const columns: Column<Order>[] = isAdmin
    ? [baseColumns[0], ...adminExtraColumns, ...baseColumns.slice(1)]
    : baseColumns;

  return (
    <div className="space-y-5">
      {kitchenOpen && <KitchenView onClose={() => setKitchenOpen(false)} />}

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isAdmin ? 'Buscar por restaurante, cliente, ID…' : 'Buscar por ID o dirección…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          />
        </div>

        {!isAdmin && (
          <button
            type="button"
            onClick={() => setKitchenOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm font-medium transition-colors"
          >
            <ChefHat size={15} />
            Vista Cocina
          </button>
        )}

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 appearance-none"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
        {statusFilter && ` con estado "${ORDER_STATUS_LABELS[statusFilter]}"`}
        {isAdmin && ' · todos los restaurantes'}
      </p>

      <DataTable
        columns={columns}
        data={filtered}
        keyField="id"
        loading={isLoading}
        emptyMessage="No se encontraron pedidos"
        onRowClick={(o) => router.push(`/dashboard/orders/${o.id}`)}
      />
    </div>
  );
}
