'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeliveryGroups, useRidersList } from '@/hooks/useConfig';
import { Card } from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { GROUP_STATUS_COLORS, GROUP_STATUS_LABELS, formatDate } from '@/lib/utils';
import type { DeliveryGroup } from '@/models';
import type { RiderInfo } from '@/hooks/useConfig';
import { Bike, Car, RefreshCw, MapPin } from 'lucide-react';

const VEHICLE_LABELS: Record<string, string> = {
  moto: 'Moto',
  bici: 'Bicicleta',
  auto: 'Auto',
};

type Tab = 'riders' | 'groups';

export default function RidersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('riders');
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useDeliveryGroups();
  const { data: riders, isLoading: ridersLoading, refetch: refetchRiders } = useRidersList();

  const active = (riders ?? []).filter((r) => r.isAvailable).length;
  const total = (riders ?? []).length;

  const riderColumns: Column<RiderInfo>[] = [
    {
      key: 'isAvailable',
      label: 'Estado',
      render: (r) => r.isAvailable ? (
        <Badge label="Activo" className="bg-green-100 text-green-700" />
      ) : (
        <Badge label="Desconectado" className="bg-gray-100 text-gray-500" />
      ),
    },
    {
      key: 'firstName',
      label: 'Repartidor',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
            {`${r.firstName?.[0] ?? ''}${r.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-gray-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (r) => <span className="text-sm text-gray-600">{r.phone || '—'}</span>,
    },
    {
      key: 'vehicleType',
      label: 'Vehículo',
      render: (r) => {
        const v = r.vehicleType;
        if (!v) return <span className="text-gray-400 text-sm">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            {v === 'auto' ? <Car size={14} /> : <Bike size={14} />}
            <span>{VEHICLE_LABELS[v] ?? v}</span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Registrado',
      render: (r) => <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'id',
      label: '',
      render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/riders/${r.id}`); }}
          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all"
          title="Ver historial y mapa"
        >
          <MapPin size={15} />
        </button>
      ),
    },
  ];

  const groupColumns: Column<DeliveryGroup>[] = [
    {
      key: 'id',
      label: 'Grupo',
      render: (g) => <span className="font-mono text-xs text-gray-500">{g.id.slice(0, 8)}…</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (g) => (
        <Badge label={GROUP_STATUS_LABELS[g.status]} className={GROUP_STATUS_COLORS[g.status]} />
      ),
    },
    {
      key: 'rider',
      label: 'Repartidor',
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
            <Bike size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{active}</p>
            <p className="text-xs text-gray-500">Activos ahora</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
            <Bike size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total - active}</p>
            <p className="text-xs text-gray-500">Desconectados</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Bike size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Total registrados</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('riders')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            tab === 'riders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Repartidores ({total})
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            tab === 'groups' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Grupos de entrega ({groups?.length ?? 0})
        </button>
      </div>

      {tab === 'riders' ? (
        <Card
          title="Lista de repartidores"
          action={
            <button
              onClick={() => refetchRiders()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              title="Actualizar"
            >
              <RefreshCw size={14} />
            </button>
          }
        >
          <p className="text-xs text-gray-400 mb-3">
            Verde = disponible en la app del repartidor · Actualiza cada 30s
          </p>
          <DataTable
            columns={riderColumns}
            data={riders ?? []}
            keyField="id"
            loading={ridersLoading}
            emptyMessage="No hay repartidores registrados"
          />
        </Card>
      ) : (
        <Card
          title="Grupos de entrega activos"
          action={
            <button
              onClick={() => refetchGroups()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              title="Actualizar"
            >
              <RefreshCw size={14} />
            </button>
          }
        >
          <p className="text-xs text-gray-400 mb-3">Actualiza cada 30s</p>
          <DataTable
            columns={groupColumns}
            data={groups ?? []}
            keyField="id"
            loading={groupsLoading}
            emptyMessage="No hay grupos de entrega disponibles"
          />
        </Card>
      )}
    </div>
  );
}
