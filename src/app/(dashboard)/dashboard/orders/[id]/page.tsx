'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Package } from 'lucide-react';
import { useOrder, useMarkPreparing, useMarkReady } from '@/hooks/useOrders';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_TYPE_LABELS,
} from '@/lib/utils';
import type { OrderStatus } from '@/models';
import toast from 'react-hot-toast';

const STATUS_FLOW: OrderStatus[] = [
  'pendiente',
  'confirmado',
  'preparando',
  'listo',
  'en_camino',
  'entregado',
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(params.id);
  const markPreparing = useMarkPreparing();
  const markReady = useMarkReady();

  if (isLoading) return <PageLoader />;
  if (!order) return <p className="text-gray-500 p-8">Pedido no encontrado</p>;

  async function handlePreparing() {
    try {
      await markPreparing.mutateAsync(order!.id);
      toast.success('Pedido marcado como "Preparando"');
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  async function handleReady() {
    try {
      await markReady.mutateAsync(order!.id);
      toast.success('Pedido marcado como "Listo"');
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Pedido{' '}
            <span className="font-mono text-gray-500">#{order.id.slice(0, 8)}</span>
          </h2>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <div className="ml-auto">
          <Badge
            label={ORDER_STATUS_LABELS[order.status]}
            className={ORDER_STATUS_COLORS[order.status]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Info */}
        <Card title="Información del pedido">
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Tipo de entrega</dt>
              <dd className="font-medium text-gray-900">
                {DELIVERY_TYPE_LABELS[order.deliveryType]}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Estado actual</dt>
              <dd>
                <Badge
                  label={ORDER_STATUS_LABELS[order.status]}
                  className={ORDER_STATUS_COLORS[order.status]}
                />
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(Number(order.total) - Number(order.deliveryFee))}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Tarifa delivery</dt>
              <dd className="font-medium">{formatCurrency(Number(order.deliveryFee))}</dd>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <dt className="font-semibold text-gray-900">Total</dt>
              <dd className="font-bold text-gray-900 text-base">
                {formatCurrency(Number(order.total))}
              </dd>
            </div>
            {order.notes && (
              <div className="pt-2 border-t">
                <dt className="text-gray-500 text-sm mb-1">Notas</dt>
                <dd className="text-gray-700 text-sm bg-gray-50 p-2 rounded-lg">
                  {order.notes}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Delivery Address */}
        <Card title="Dirección de entrega">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-700">{order.deliveryAddress || 'No especificada'}</p>
              {order.deliveryLat && (
                <p className="text-xs text-gray-400 mt-1">
                  {Number(order.deliveryLat).toFixed(6)}, {Number(order.deliveryLng).toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <Card title="Productos del pedido">
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.menuItem?.name ?? `Item ${item.menu_item_id.slice(0, 8)}`}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-400">{item.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(Number(item.unit_price) * item.quantity)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × {formatCurrency(Number(item.unit_price))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Status Update — solo las transiciones que le corresponden al admin */}
      {(order.status === 'confirmado' || order.status === 'preparando') && (
        <Card title="Actualizar estado">
          <div className="flex gap-3 flex-wrap items-center">
            {order.status === 'confirmado' && (
              <Button
                variant="primary"
                onClick={handlePreparing}
                loading={markPreparing.isPending}
              >
                Iniciar preparación
              </Button>
            )}
            {order.status === 'preparando' && (
              <Button
                variant="primary"
                onClick={handleReady}
                loading={markReady.isPending}
              >
                Marcar como listo
              </Button>
            )}
            <p className="text-xs text-gray-400">
              {order.status === 'confirmado'
                ? 'El pedido pasará a "Preparando"'
                : 'El pedido quedará disponible para que el rider lo recoja'}
            </p>
          </div>
        </Card>
      )}

      {/* Progress stepper */}
      <Card title="Progreso del pedido">
        <div className="flex items-center gap-0">
          {STATUS_FLOW.map((status, i) => {
            const isCompleted =
              STATUS_FLOW.indexOf(order.status) > i;
            const isCurrent = order.status === status;
            return (
              <div key={status} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    style={isCurrent ? { backgroundColor: '#f97316' } : {}}
                  >
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 text-center leading-tight max-w-[60px]">
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                      STATUS_FLOW.indexOf(order.status) > i ? 'bg-green-400' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
