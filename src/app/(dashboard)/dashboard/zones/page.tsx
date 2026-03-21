'use client';

import { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import {
  useZones,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
  type DeliveryZone,
} from '@/hooks/useZones';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ZoneMapPicker from '@/components/ui/ZoneMapPicker';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type ZoneForm = Omit<DeliveryZone, 'id' | 'createdAt'>;

const EMPTY_FORM: ZoneForm = {
  name: '',
  city: '',
  centerLat: -17.7833,
  centerLng: -63.1812,
  radiusMeters: 5000,
  isActive: true,
};

export default function ZonesPage() {
  const { data: zones, isLoading } = useZones();
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalMode('create');
  }

  function openEdit(zone: DeliveryZone) {
    setForm({
      name: zone.name,
      city: zone.city,
      centerLat: Number(zone.centerLat),
      centerLng: Number(zone.centerLng),
      radiusMeters: Number(zone.radiusMeters),
      isActive: zone.isActive,
    });
    setEditingId(zone.id);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
  }

  function setField<K extends keyof ZoneForm>(key: K, value: ZoneForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.city.trim()) {
      toast.error('Nombre y ciudad son requeridos');
      return;
    }
    try {
      if (modalMode === 'create') {
        await createZone.mutateAsync(form);
        toast.success('Zona creada');
      } else if (editingId) {
        await updateZone.mutateAsync({ id: editingId, ...form });
        toast.success('Zona actualizada');
      }
      closeModal();
    } catch {
      toast.error('No se pudo guardar la zona');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteZone.mutateAsync(id);
      toast.success('Zona eliminada');
      setDeleteId(null);
    } catch {
      toast.error('No se pudo eliminar la zona');
    }
  }

  const columns: Column<DeliveryZone>[] = [
    {
      key: 'name',
      label: 'Zona',
      render: (z) => (
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-orange-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-900 text-sm">{z.name}</p>
            <p className="text-xs text-gray-400">{z.city}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'center',
      label: 'Centro',
      render: (z) => (
        <span className="text-xs text-gray-500 font-mono">
          {Number(z.centerLat).toFixed(5)}, {Number(z.centerLng).toFixed(5)}
        </span>
      ),
    },
    {
      key: 'radius',
      label: 'Radio',
      render: (z) => (
        <span className="text-sm text-gray-700">
          {(Number(z.radiusMeters) / 1000).toFixed(1)} km
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (z) => (
        <Badge
          label={z.isActive ? 'Activa' : 'Inactiva'}
          className={z.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Creada',
      render: (z) => <span className="text-xs text-gray-400">{formatDate(z.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (z) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(z)}>
            <Pencil size={13} />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setDeleteId(z.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const isSaving = createZone.isPending || updateZone.isPending;
  const radiusKm = (form.radiusMeters / 1000).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Define las zonas geográficas de cobertura para delivery.
        </p>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={15} />
          Nueva zona
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={zones ?? []}
        keyField="id"
        loading={isLoading}
        emptyMessage="No hay zonas definidas"
      />

      {/* Create / Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modalMode === 'create' ? 'Nueva zona de entrega' : 'Editar zona'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Name + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Ej: Santa Cruz Centro"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="Ej: Santa Cruz"
                  />
                </div>
              </div>

              {/* Map picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Centro de la zona
                </label>
                <ZoneMapPicker
                  centerLat={form.centerLat}
                  centerLng={form.centerLng}
                  radiusMeters={form.radiusMeters}
                  onCenterChange={(lat, lng) => {
                    setField('centerLat', lat);
                    setField('centerLng', lng);
                  }}
                />
                {/* Read-only coords display */}
                <div className="flex gap-3 mt-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Latitud</label>
                    <input
                      type="number"
                      step="0.00001"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={form.centerLat}
                      onChange={(e) => setField('centerLat', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Longitud</label>
                    <input
                      type="number"
                      step="0.00001"
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={form.centerLng}
                      onChange={(e) => setField('centerLng', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Radius slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Radio de cobertura</label>
                  <span className="text-sm font-semibold text-orange-500">
                    {radiusKm} km
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      ({form.radiusMeters.toLocaleString()} m)
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={100}
                  value={form.radiusMeters}
                  onChange={(e) => setField('radiusMeters', parseInt(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5 km</span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-orange-500"
                />
                <span className="text-sm text-gray-700">Zona activa</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 pb-6">
              <Button variant="secondary" onClick={closeModal}>
                Cancelar
              </Button>
              <Button variant="primary" loading={isSaving} onClick={handleSave}>
                <Save size={14} />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Eliminar zona</h3>
            <p className="text-sm text-gray-500 mb-5">
              ¿Confirmas que deseas eliminar esta zona? Los restaurantes y repartidores asignados
              quedarán sin zona.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={deleteZone.isPending}
                onClick={() => handleDelete(deleteId)}
              >
                <Trash2 size={14} />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
