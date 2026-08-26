'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeliveryGroups, useRidersList } from '@/hooks/useConfig';
import { useUpdateRiderInfo, useUploadRiderImage } from '@/hooks/useUsers';
import { Card } from '@/components/ui/Card';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { GROUP_STATUS_COLORS, GROUP_STATUS_LABELS, formatDate } from '@/lib/utils';
import type { DeliveryGroup, VehicleType } from '@/models';
import type { RiderInfo } from '@/hooks/useConfig';
import { Bike, Car, RefreshCw, MapPin, Coins, X, Save, ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const updateRiderInfo = useUpdateRiderInfo();
  const uploadRiderImage = useUploadRiderImage();

  const [editingRider, setEditingRider] = useState<RiderInfo | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [licenseFrontUrl, setLicenseFrontUrl] = useState('');
  const [licenseBackUrl, setLicenseBackUrl] = useState('');
  const [plate, setPlate] = useState('');
  const [policyUrl, setPolicyUrl] = useState('');
  const [vin, setVin] = useState('');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  function openEdit(rider: RiderInfo) {
    setEditingRider(rider);
    setVehicleType((rider.vehicleType ?? '') as VehicleType | '');
    setLicenseFrontUrl(rider.licenseFrontUrl ?? '');
    setLicenseBackUrl(rider.licenseBackUrl ?? '');
    setPlate(rider.plate ?? '');
    setPolicyUrl(rider.policyUrl ?? '');
    setVin(rider.vin ?? '');
  }

  async function handleImageUpload(type: 'front' | 'back', file: File) {
    if (!editingRider) return;
    try {
      const url = await uploadRiderImage.mutateAsync({ id: editingRider.accountId, type, file });
      if (type === 'front') setLicenseFrontUrl(url);
      else setLicenseBackUrl(url);
    } catch {
      toast.error('No se pudo subir la imagen');
    }
  }

  async function saveRiderInfo() {
    if (!editingRider) return;
    try {
      await updateRiderInfo.mutateAsync({
        id: editingRider.accountId,
        info: {
          vehicleType: (vehicleType || null) as VehicleType | null,
          licenseFrontUrl: licenseFrontUrl || null,
          licenseBackUrl: licenseBackUrl || null,
          plate: plate || null,
          policyUrl: policyUrl || null,
          vin: vin || null,
        },
      });
      toast.success('Info del repartidor guardada');
      refetchRiders();
      setEditingRider(null);
    } catch {
      toast.error('No se pudo guardar la info del repartidor');
    }
  }

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
      key: 'creditBalance',
      label: 'Créditos',
      render: (r) => {
        const bal = r.creditBalance ?? 0;
        return (
          <div className={`flex items-center gap-1 text-sm font-medium ${bal === 0 ? 'text-red-500' : bal <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
            <Coins size={13} />
            {bal}
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
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all"
            title="Editar info del repartidor"
          >
            <ImageIcon size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/riders/${r.id}`); }}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all"
            title="Ver historial y mapa"
          >
            <MapPin size={15} />
          </button>
        </div>
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

      {/* ── Edit rider info modal ── */}
      {editingRider && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900">
                Datos de {editingRider.firstName} {editingRider.lastName}
              </h3>
              <button onClick={() => setEditingRider(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Todos los campos son opcionales.</p>

            <div className="space-y-3 mb-5">
              {/* License photos */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: 'Licencia anverso', type: 'front' as const, url: licenseFrontUrl, ref: frontInputRef },
                  { label: 'Licencia reverso', type: 'back' as const, url: licenseBackUrl, ref: backInputRef },
                ] as const).map(({ label, type, url, ref }) => (
                  <div key={type}>
                    <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
                    <input
                      ref={ref}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(type, f);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => ref.current?.click()}
                      disabled={uploadRiderImage.isPending}
                      className="w-full h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden relative"
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon size={22} className="text-gray-300" />
                          <span className="text-xs text-gray-400">Subir foto</span>
                        </>
                      )}
                      {uploadRiderImage.isPending && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Upload size={16} className="text-orange-500 animate-bounce" />
                        </div>
                      )}
                    </button>
                    {url && (
                      <button
                        type="button"
                        onClick={() => type === 'front' ? setLicenseFrontUrl('') : setLicenseBackUrl('')}
                        className="text-xs text-red-400 hover:text-red-600 mt-1"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Vehículo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehículo</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                >
                  <option value="">Sin especificar</option>
                  <option value="moto">Moto</option>
                  <option value="auto">Auto</option>
                  <option value="bici">Bicicleta</option>
                </select>
              </div>

              {[
                { label: 'Placa', value: plate, set: setPlate },
                { label: 'Póliza — URL o referencia', value: policyUrl, set: setPolicyUrl },
                { label: 'VIN / Chasis', value: vin, set: setVin },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    placeholder="Opcional"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingRider(null)}>
                Cancelar
              </Button>
              <Button variant="primary" loading={updateRiderInfo.isPending} onClick={saveRiderInfo}>
                <Save size={14} />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
