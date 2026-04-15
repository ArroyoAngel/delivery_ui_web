'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChefHat, CheckCircle, Clock } from 'lucide-react';
import { useOrders, useAdminOrders, useManualConfirmPayment, useRejectPayment } from '@/hooks/useOrders';
import { useOrdersSocket } from '@/hooks/useOrdersSocket';
import { useAuthStore } from '@/store/useAuthStore';
import KitchenView from '@/components/KitchenView';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_TYPE_LABELS,
} from '@/lib/utils';
import type { Order, OrderStatus } from '@/models';
import toast from 'react-hot-toast';

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
  const [proofModal, setProofModal] = useState<Order | null>(null);
  const [proofStep, setProofStep] = useState<'view' | 'reject'>('view');
  const [rejectReason, setRejectReason] = useState('');

  const manualConfirm = useManualConfirmPayment();
  const rejectPayment = useRejectPayment();

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
      key: 'paidAt' as keyof Order,
      label: 'Pago',
      render: (o) => {
        if (o.paymentMethod === 'cash') {
          return (
            <Badge
              label="Efectivo"
              className="bg-blue-50 text-blue-700 border border-blue-200"
            />
          );
        }
        if (o.paidAt) {
          return (
            <div className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">Pagado</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-yellow-600" />
            <span className="text-xs text-yellow-700 font-medium">Pendiente</span>
          </div>
        );
      },
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

  const adminActionColumn: Column<Order>[] = [
    {
      key: 'action' as keyof Order,
      label: 'Acción',
      render: (o) => {
        // Solo mostrar acciones para órdenes pendientes con pago QR
        if (o.status !== 'pendiente' || o.paymentMethod === 'cash') return null;

        if (o.paymentProofUrl) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setProofModal(o);
                setProofStep('view');
                setRejectReason('');
              }}
            >
              Ver comprobante
            </Button>
          );
        }

        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              manualConfirm.mutate(o.id);
            }}
            loading={manualConfirm.isPending}
          >
            Confirmar
          </Button>
        );
      },
    },
  ];

  const columns: Column<Order>[] = isAdmin
    ? [baseColumns[0], ...adminExtraColumns, ...baseColumns.slice(1), ...adminActionColumn]
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

      {/* Proof Modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {proofStep === 'view' ? (
              <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Comprobante de Pago</h2>
                  <p className="text-sm text-gray-500">Pedido #{proofModal.id.slice(0, 8)}</p>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Negocio:</span>
                    <span className="font-medium text-gray-900">{proofModal.shopName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-gray-900">{proofModal.clientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(Number(proofModal.total))}</span>
                  </div>
                </div>

                {/* Proof Image */}
                {proofModal.paymentProofUrl ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Comprobante enviado:</p>
                    <img
                      src={proofModal.paymentProofUrl}
                      alt="Comprobante de pago"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">Sin comprobante enviado aún</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      try {
                        await manualConfirm.mutateAsync(proofModal.id);
                        toast.success('Pago confirmado manualmente');
                        setProofModal(null);
                      } catch (err) {
                        toast.error('Error al confirmar pago');
                      }
                    }}
                    loading={manualConfirm.isPending}
                  >
                    Confirmar pago
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setProofStep('reject')}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setProofModal(null)}
                    className="ml-auto"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {/* Reject step */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Rechazar Pago</h2>
                  <p className="text-sm text-gray-500">Pedido #{proofModal.id.slice(0, 8)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Razón del rechazo
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Describe por qué rechazas este comprobante..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!rejectReason.trim()) {
                        toast.error('Ingresa una razón');
                        return;
                      }
                      try {
                        await rejectPayment.mutateAsync({
                          id: proofModal.id,
                          reason: rejectReason,
                        });
                        toast.success('Pago rechazado');
                        setProofModal(null);
                      } catch (err) {
                        toast.error('Error al rechazar pago');
                      }
                    }}
                    loading={rejectPayment.isPending}
                  >
                    Confirmar rechazo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setProofStep('view');
                      setRejectReason('');
                    }}
                    className="ml-auto"
                  >
                    Volver
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
