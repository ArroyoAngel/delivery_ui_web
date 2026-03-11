'use client';

import { useDeliveryGroups } from '@/hooks/useConfig';
import { Card } from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { GROUP_STATUS_COLORS, GROUP_STATUS_LABELS, formatDate } from '@/lib/utils';
import type { DeliveryGroup } from '@/models';

export default function RidersPage() {
  const { data: groups, isLoading } = useDeliveryGroups();

  const columns: Column<DeliveryGroup>[] = [
    {
      key: 'id',
      label: 'Grupo',
      render: (g) => (
        <span className="font-mono text-xs text-gray-500">{g.id.slice(0, 8)}…</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (g) => (
        <Badge
          label={GROUP_STATUS_LABELS[g.status]}
          className={GROUP_STATUS_COLORS[g.status]}
        />
      ),
    },
    {
      key: 'rider',
      label: 'Rider',
      render: (g) => (
        <span className="text-sm text-gray-700">
          {g.rider ? `${g.rider.firstName} ${g.rider.lastName}` : 'Sin asignar'}
        </span>
      ),
    },
    {
      key: 'orders',
      label: 'Pedidos',
      render: (g) => <span className="text-sm">{g.orders?.length ?? 0}</span>,
    },
    {
      key: 'createdAt',
      label: 'Creado',
      render: (g) => <span className="text-xs text-gray-400">{formatDate(g.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <Card title="Grupos de entrega disponibles">
        <p className="text-sm text-gray-500 mb-4">
          Esta vista se actualiza automáticamente cada 30 segundos para mostrar los grupos activos.
        </p>

        <DataTable
          columns={columns}
          data={groups ?? []}
          keyField="id"
          loading={isLoading}
          emptyMessage="No hay grupos de entrega disponibles"
        />
      </Card>
    </div>
  );
}
