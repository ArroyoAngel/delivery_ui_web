'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  DollarSign,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  UtensilsCrossed,
  Package,
  ChevronRight,
  Pencil,
  Check,
  X,
  Users,
} from 'lucide-react';
import { useRestaurant, useToggleRestaurantOpen } from '@/hooks/useRestaurants';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: restaurant, isLoading, refetch } = useRestaurant(params.id);
  const toggleOpen = useToggleRestaurantOpen();

  // Editable fields state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    deliveryFee: '',
    deliveryTimeMin: '',
    minimumOrder: '',
    openingTime: '',
    closingTime: '',
  });

  function startEdit() {
    if (!restaurant) return;
    setForm({
      name: restaurant.name,
      description: restaurant.description ?? '',
      address: restaurant.address,
      deliveryFee: String(restaurant.deliveryFee),
      deliveryTimeMin: String(restaurant.deliveryTimeMin),
      minimumOrder: String(restaurant.minimumOrder),
      openingTime: restaurant.openingTime ?? '',
      closingTime: restaurant.closingTime ?? '',
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.patch(`/api/restaurants/${params.id}`, {
        name: form.name,
        description: form.description,
        address: form.address,
        deliveryFee: Number(form.deliveryFee),
        deliveryTimeMin: Number(form.deliveryTimeMin),
        minimumOrder: Number(form.minimumOrder),
        openingTime: form.openingTime || null,
        closingTime: form.closingTime || null,
      });
      await refetch();
      setEditing(false);
      toast.success('Restaurante actualizado');
    } catch {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (!restaurant) return;
    try {
      await toggleOpen.mutateAsync({ id: restaurant.id, isOpen: !restaurant.isOpen });
      toast.success(`${restaurant.name} ${!restaurant.isOpen ? 'abierto' : 'cerrado'}`);
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  if (isLoading) return <PageLoader />;
  if (!restaurant) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Restaurante no encontrado.</p>
        <button onClick={() => router.back()} className="mt-3 text-orange-500 text-sm hover:underline">
          Volver
        </button>
      </div>
    );
  }

  const totalItems = (restaurant.menuCategories ?? []).reduce(
    (acc, cat) => acc + (cat.items?.length ?? 0),
    0,
  );
  const availableItems = (restaurant.menuCategories ?? []).reduce(
    (acc, cat) => acc + (cat.items?.filter((i) => i.isAvailable).length ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{restaurant.name}</h2>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin size={11} />
            {restaurant.address}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={startEdit}>
                <Pencil size={14} />
                Editar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/dashboard/restaurants/${params.id}/menu`)}
              >
                <UtensilsCrossed size={14} />
                Ver Menú
                <ChevronRight size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                <X size={14} />
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={saveEdit} disabled={saving}>
                <Check size={14} />
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Info card ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
            {restaurant.imageUrl ? (
              <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={28} className="text-gray-300" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-3">
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fee de delivery (Bs)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.deliveryFee}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryFee: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tiempo de entrega (min)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.deliveryTimeMin}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryTimeMin: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pedido mínimo (Bs)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.minimumOrder}
                    onChange={(e) => setForm((f) => ({ ...f, minimumOrder: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hora apertura</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.openingTime}
                    onChange={(e) => setForm((f) => ({ ...f, openingTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hora cierre</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.closingTime}
                    onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleToggle}
                    className="flex items-center gap-1.5 transition-all"
                    disabled={toggleOpen.isPending}
                  >
                    {restaurant.isOpen ? (
                      <>
                        <ToggleRight size={20} className="text-green-500" />
                        <Badge label="Abierto" className="bg-green-100 text-green-700" />
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={20} className="text-gray-400" />
                        <Badge label="Cerrado" className="bg-gray-100 text-gray-500" />
                      </>
                    )}
                  </button>
                  <Badge
                    label={`⭐ ${Number(restaurant.rating).toFixed(1)}`}
                    className="bg-yellow-50 text-yellow-700"
                  />
                  {restaurant.category && (
                    <Badge label={restaurant.category.name} className="bg-blue-50 text-blue-700" />
                  )}
                </div>

                <p className="text-sm text-gray-600">{restaurant.description || 'Sin descripción'}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign size={14} className="text-orange-400 flex-shrink-0" />
                    <span>Fee: <strong>{formatCurrency(Number(restaurant.deliveryFee))}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-orange-400 flex-shrink-0" />
                    <span><strong>{restaurant.deliveryTimeMin}</strong> min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShoppingBag size={14} className="text-orange-400 flex-shrink-0" />
                    <span>Mín: <strong>{formatCurrency(Number(restaurant.minimumOrder))}</strong></span>
                  </div>
                  {(restaurant.openingTime || restaurant.closingTime) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2 sm:col-span-1">
                      <Clock size={14} className="text-orange-400 flex-shrink-0" />
                      <span>
                        Horario:{' '}
                        <strong>
                          {restaurant.openingTime ?? '—'} – {restaurant.closingTime ?? '—'}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Menu summary ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Categorías</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {restaurant.menuCategories?.length ?? 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <UtensilsCrossed size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Items en menú</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <Package size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {availableItems}
                <span className="text-sm font-normal text-gray-400 ml-1">/ {totalItems}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
              <Star size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu preview ──────────────────────────────────────────────── */}
      {(restaurant.menuCategories?.length ?? 0) > 0 ? (
        <Card
          title="Vista previa del menú"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/restaurants/${params.id}/menu`)}
            >
              Ver completo
              <ChevronRight size={14} />
            </Button>
          }
        >
          <div className="space-y-4">
            {restaurant.menuCategories.map((cat) => (
              <div key={cat.id}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {cat.name} ({cat.items?.length ?? 0})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(cat.items ?? []).slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package size={13} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-orange-600 font-semibold">
                          {formatCurrency(Number(item.price))}
                        </p>
                      </div>
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.isAvailable ? 'bg-green-400' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                  {(cat.items?.length ?? 0) > 4 && (
                    <p className="text-xs text-gray-400 col-span-full text-center py-1">
                      +{(cat.items?.length ?? 0) - 4} más en esta categoría
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <UtensilsCrossed size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Este restaurante aún no tiene menú configurado.</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => router.push(`/dashboard/restaurants/${params.id}/menu`)}
            >
              Configurar menú
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
