'use client';

import { useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  Upload,
  QrCode,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMyShop, useToggleShopOpen, useUploadShopQr, useShopCategories, useAssignShopCategories, useUploadShopImage, useRemoveShopImage, useBusinessTypes, type BusinessType } from '@/hooks/useShops';
import { type ShopCategory, type MenuCategory, type MenuItem } from '@/models';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SelectableChip from '@/components/ui/SelectableChip';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function MyShopPage() {
  const router = useRouter();
  const { data: restaurant, isLoading, isError, refetch } = useMyShop();
  const { data: businessTypes = [] } = useBusinessTypes();
  const toggleOpen = useToggleShopOpen();
  const uploadQr = useUploadShopQr();
  const assignCategories = useAssignShopCategories();
  const { data: allCategories = [] } = useShopCategories();
  const uploadImage = useUploadShopImage();
  const removeImage = useRemoveShopImage();
  const qrInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [editingImages, setEditingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
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

  // Filtrar categorías por tipo de negocio
  const availableCategories = useMemo(
    () => allCategories.filter((cat: ShopCategory) => cat.id === restaurant?.businessTypeId),
    [allCategories, restaurant?.businessTypeId],
  );

  async function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;
    try {
      await uploadQr.mutateAsync({ shopId: restaurant.id, file });
      toast.success('QR actualizado');
    } catch {
      toast.error('Error al subir el QR');
    } finally {
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar que no exceda 5 imágenes
    if ((restaurant?.imageUrls?.length ?? 0) + editingImages.length >= 5) {
      toast.error('Máximo 5 imágenes permitidas');
      return;
    }

    setNewImageFiles([...newImageFiles, file]);

    // Mostrar preview inmediatamente
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingImages([...editingImages, event.target?.result as string]);
    };
    reader.readAsDataURL(file);
  }

  function removeEditingImage(index: number) {
    setEditingImages((prev) => prev.filter((_, i) => i !== index));
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleRemoveImage(imageUrl: string) {
    if (!restaurant) return;
    try {
      await removeImage.mutateAsync({
        shopId: restaurant.id,
        imageUrl,
      });
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar la imagen');
    }
  }

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
    setSelectedCategoryIds([]);
    setEditingImages([]);
    setNewImageFiles([]);
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      // Guardar cambios básicos del negocio
      await api.patch(`/api/shops/${restaurant!.id}`, {
        name: form.name,
        description: form.description,
        address: form.address,
        deliveryFee: Number(form.deliveryFee),
        deliveryTimeMin: Number(form.deliveryTimeMin),
        minimumOrder: Number(form.minimumOrder),
        openingTime: form.openingTime || null,
        closingTime: form.closingTime || null,
      });

      // Guardar todas las imágenes nuevas si fueron seleccionadas
      if (newImageFiles.length > 0) {
        try {
          for (const file of newImageFiles) {
            await uploadImage.mutateAsync({
              shopId: restaurant!.id,
              file,
            });
          }
        } catch {
          toast.error('Se actualizó el negocio pero no se pudieron guardar todas las imágenes');
        }
      }

      // Guardar categorías si hay seleccionadas
      if (selectedCategoryIds.length > 0 || availableCategories.length > 0) {
        try {
          await assignCategories.mutateAsync({
            shopId: restaurant!.id,
            categoryIds: selectedCategoryIds,
          });
        } catch {
          toast.error('Se actualizó el negocio pero no se pudieron guardar las categorías');
        }
      }

      await refetch();
      setEditing(false);
      setEditingImages([]);
      setNewImageFiles([]);
      toast.success('Negocio actualizado');
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
      await refetch();
      toast.success(`${restaurant.name} ${!restaurant.isOpen ? 'abierto' : 'cerrado'}`);
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  if (isLoading) return <PageLoader />;

  if (isError || (!isLoading && !restaurant)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <UtensilsCrossed size={40} className="mb-4 opacity-30" />
        <p className="text-sm">No tenés un negocio asignado.</p>
        <p className="text-xs mt-1">Contactá a un administrador.</p>
      </div>
    );
  }

  if (!restaurant) return <PageLoader />;

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
                onClick={() => router.push('/dashboard/my-shop/menu')}
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
        <div className="grid grid-cols-[auto_1fr] gap-6">
          {/* Galería de imágenes - Columna izquierda */}
          <div className="flex flex-col gap-2">
            {editing && <label className="text-xs font-medium text-gray-500">Imágenes ({(restaurant?.imageUrls?.length ?? 0) + editingImages.length}/5)</label>}
            {editing ? (
              <>
                <div className="flex flex-col gap-2">
                  {/* Botón + para agregar imagen (solo si hay menos de 5) */}
                  {(restaurant?.imageUrls?.length ?? 0) + editingImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors"
                    >
                      <Plus size={24} className="text-orange-500" />
                    </button>
                  )}

                  {/* Imágenes existentes (del restaurant) */}
                  {(restaurant?.imageUrls ?? []).map((url) => (
                    <div
                      key={url}
                      className="relative group w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="shop" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  ))}

                  {/* Preview de nueva imagen (si hay) */}
                  {editingImages.map((preview, idx) => (
                    <div
                      key={`preview-${idx}`}
                      className="relative group w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="preview" className="w-full h-full object-cover opacity-50 border border-orange-300" />
                      <button
                        type="button"
                        onClick={() => removeEditingImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFile}
                  className="hidden"
                />
              </>
            ) : (
              <>
                {(restaurant?.imageUrls ?? []).length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {(restaurant?.imageUrls ?? []).map((url) => (
                      <div key={url} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="shop" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                    <Package size={28} />
                  </div>
                )}
              </>
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
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.description} rows={3}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {availableCategories.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Categorías</label>
                    <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                      {availableCategories.map((cat: ShopCategory) => (
                        <SelectableChip
                          key={cat.id}
                          id={cat.id}
                          label={cat.name}
                          icon={cat.icon}
                          selected={selectedCategoryIds.includes(cat.id)}
                          onToggle={(id) => {
                            if (selectedCategoryIds.includes(id)) {
                              setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id));
                            } else {
                              setSelectedCategoryIds([...selectedCategoryIds, id]);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
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
              <div className="space-y-4">
                {/* Header con toggle y rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>

                {/* 2 columnas: Info izquierda | Métricas derecha */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Columna izquierda: Info del negocio */}
                  <div className="space-y-3 text-sm">
                    {/* Tipo de negocio */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Tipo</p>
                      <p className="text-gray-900 font-medium">
                        {businessTypes.find((bt: BusinessType) => bt.value === restaurant.businessTypeId)?.label || 'Sin tipo'}
                      </p>
                    </div>

                    {/* Descripción */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Descripción</p>
                      <p className="text-gray-600">{restaurant.description || 'Sin descripción'}</p>
                    </div>

                    {/* Dirección */}
                    <div className="flex gap-2">
                      <MapPin size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Ubicación</p>
                        <p className="text-gray-600">{restaurant.address}</p>
                      </div>
                    </div>

                    {/* Categorías del menú */}
                    {restaurant.menuCategories && restaurant.menuCategories.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Categorías</p>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.menuCategories.map((cat: MenuCategory & { items: MenuItem[] }) => (
                            <Badge
                              key={cat.id}
                              label={cat.name}
                              className="bg-orange-50 text-orange-700 text-xs"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR de pago */}
                    {restaurant.qrImageUrl && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">QR de Pago</p>
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={restaurant.qrImageUrl} alt="QR" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Columna derecha: Métricas y detalles operacionales */}
                  <div className="space-y-3">
                    {(() => {
                      const allItems = (restaurant.menuCategories ?? []).flatMap((cat: MenuCategory & { items: MenuItem[] }) => cat.items ?? []);
                      const prices = allItems.map((item: MenuItem) => Number(item.price)).filter((p: number) => !isNaN(p));
                      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                      const avgPrice = prices.length > 0 ? (prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(2) : 0;

                      return (
                        <div className="bg-orange-50 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">Rango de Precios</p>
                          <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-600">Mínimo</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(minPrice)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-orange-200">
                            <DollarSign size={16} className="text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-600">Promedio</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(Number(avgPrice))}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-orange-200">
                            <DollarSign size={16} className="text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-600">Máximo</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(maxPrice)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Configuración</p>
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={16} className="text-red-500" />
                        <div>
                          <p className="text-xs text-gray-600">Pedido mínimo</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(Number(restaurant.minimumOrder))}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Operación</p>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-600">Tiempo entrega</p>
                          <p className="font-semibold text-gray-900">{restaurant.deliveryTimeMin} min</p>
                        </div>
                      </div>
                      {(restaurant.openingTime || restaurant.closingTime) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                          <Clock size={16} className="text-blue-500" />
                          <div>
                            <p className="text-xs text-gray-600">Horario</p>
                            <p className="font-semibold text-gray-900">
                              {restaurant.openingTime ?? '—'} – {restaurant.closingTime ?? '—'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
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

      {/* ── QR de pago ────────────────────────────────────────────────── */}
      <Card title="QR de pago estático">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {restaurant.qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.qrImageUrl} alt="QR de pago" className="w-full h-full object-contain" />
            ) : (
              <QrCode size={40} className="text-gray-300" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-gray-600">
              Este QR se muestra al cobrar en el punto de venta. El cliente lo escanea y confirma el monto manualmente.
            </p>
            {restaurant.qrImageUrl && (
              <p className="text-xs text-gray-400 break-all">{restaurant.qrImageUrl}</p>
            )}
            <input
              ref={qrInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleQrFile}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => qrInputRef.current?.click()}
              loading={uploadQr.isPending}
            >
              <Upload size={14} />
              {restaurant.qrImageUrl ? 'Cambiar QR' : 'Subir QR'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Menu preview ──────────────────────────────────────────────── */}
      {(restaurant.menuCategories?.length ?? 0) > 0 ? (
        <Card
          title="Vista previa del menú"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/my-shop/menu')}
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
                        // eslint-disable-next-line @next/next/no-img-element
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
            <p className="text-sm">Este negocio aún no tiene menú configurado.</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/my-shop/menu')}
            >
              Configurar menú
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
