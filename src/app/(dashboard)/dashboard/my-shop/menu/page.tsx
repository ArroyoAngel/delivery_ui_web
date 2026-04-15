'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ToggleLeft, ToggleRight, Package, Check, X, Pencil } from 'lucide-react';
import { useMyShop, useUpdateMenuItemAvailability, useUpdateMenuItem } from '@/hooks/useShops';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/models';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type StockEdit = { stock: string; dailyLimit: string };
type ProductEdit = { name: string; description: string; price: string; imageUrl: string };

export default function MyShopMenuPage() {
  const router = useRouter();
  const { data: restaurant, isLoading, refetch } = useMyShop();
  const updateAvailability = useUpdateMenuItemAvailability();
  const updateMenuItem = useUpdateMenuItem();
  const [stockEditing, setStockEditing] = useState<Record<string, StockEdit>>({});
  const [stockSaving, setStockSaving] = useState<Record<string, boolean>>({});
  const [productEditing, setProductEditing] = useState<Record<string, ProductEdit>>({});

  function startProductEdit(item: MenuItem) {
    setProductEditing((prev) => ({
      ...prev,
      [item.id]: {
        name: item.name,
        description: item.description ?? '',
        price: String(item.price),
        imageUrl: item.imageUrl ?? '',
      },
    }));
  }

  function cancelProductEdit(itemId: string) {
    setProductEditing((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  async function saveProductEdit(item: MenuItem) {
    const edit = productEditing[item.id];
    if (!edit) return;
    const price = parseFloat(edit.price);
    if (!edit.name.trim() || isNaN(price) || price < 0) {
      toast.error('Nombre y precio válido son requeridos');
      return;
    }
    try {
      await updateMenuItem.mutateAsync({
        shopId: restaurant!.id,
        itemId: item.id,
        name: edit.name.trim(),
        description: edit.description.trim(),
        price,
        imageUrl: edit.imageUrl.trim() || undefined,
      });
      cancelProductEdit(item.id);
      toast.success('Producto actualizado');
    } catch {
      toast.error('Error al guardar producto');
    }
  }

  if (isLoading) return <PageLoader />;
  if (!restaurant) return <p className="text-gray-500 p-8">Negocio no encontrado</p>;

  async function handleToggleItem(item: MenuItem) {
    try {
      await updateAvailability.mutateAsync({
        shopId: restaurant!.id,
        itemId: item.id,
        isAvailable: !item.isAvailable,
      });
      toast.success(`${item.name} ${!item.isAvailable ? 'habilitado' : 'deshabilitado'}`);
    } catch {
      toast.error('Error al actualizar item');
    }
  }

  function startStockEdit(item: MenuItem) {
    setStockEditing((prev) => ({
      ...prev,
      [item.id]: {
        stock: item.stock != null ? String(item.stock) : '',
        dailyLimit: item.dailyLimit != null ? String(item.dailyLimit) : '',
      },
    }));
  }

  function cancelStockEdit(itemId: string) {
    setStockEditing((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  async function saveStockEdit(item: MenuItem) {
    const edit = stockEditing[item.id];
    if (!edit) return;
    setStockSaving((prev) => ({ ...prev, [item.id]: true }));
    try {
      await api.patch(`/api/shops/${restaurant!.id}/menu/${item.id}`, {
        stock: edit.stock === '' ? null : Number(edit.stock),
        dailyLimit: edit.dailyLimit === '' ? null : Number(edit.dailyLimit),
      });
      await refetch();
      cancelStockEdit(item.id);
      toast.success('Stock actualizado');
    } catch {
      toast.error('Error al guardar stock');
    } finally {
      setStockSaving((prev) => ({ ...prev, [item.id]: false }));
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
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">{restaurant.name}</h2>
          <p className="text-xs text-gray-400">{restaurant.address}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/dashboard/my-shop/menu/new')}
        >
          <Plus size={14} />
          Agregar item
        </Button>
      </div>

      {/* Restaurant info */}
      <Card>
        <div className="flex gap-4 items-center">
          {restaurant.imageUrls && restaurant.imageUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={restaurant.imageUrls[0]} alt={restaurant.name} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <Package size={24} className="text-gray-300" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge
                label={restaurant.isOpen ? 'Abierto' : 'Cerrado'}
                className={restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
              />
              <Badge label={`⭐ ${Number(restaurant.rating).toFixed(1)}`} className="bg-yellow-50 text-yellow-700" />
              <Badge label={`${restaurant.deliveryTimeMin} min`} className="bg-blue-50 text-blue-700" />
              <Badge label={`Fee: ${formatCurrency(Number(restaurant.deliveryFee))}`} className="bg-purple-50 text-purple-700" />
            </div>
            <p className="text-sm text-gray-600 mt-1">{restaurant.description}</p>
          </div>
        </div>
      </Card>

      {/* Menu categories */}
      {restaurant.menuCategories?.length > 0 ? (
        restaurant.menuCategories.map((category) => (
          <Card key={category.id} title={category.name}>
            <div className="space-y-2">
              {category.items?.length > 0 ? (
                category.items.map((item) => {
                  const editing = stockEditing[item.id];
                  const saving = stockSaving[item.id];
                  return (
                    <div key={item.id} className="rounded-lg border border-gray-100 hover:border-gray-200 transition-all">
                    <div
                      className="flex items-start gap-3 p-3"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400 truncate">{item.description}</p>
                        <p className="text-sm font-semibold text-orange-600 mt-0.5">
                          {formatCurrency(Number(item.price))}
                        </p>

                        {editing ? (
                          <div className="mt-2 flex flex-wrap items-end gap-2">
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Stock (vacío = ∞)</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="∞"
                                className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                value={editing.stock}
                                onChange={(e) =>
                                  setStockEditing((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], stock: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Límite/día (vacío = ∞)</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="∞"
                                className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                value={editing.dailyLimit}
                                onChange={(e) =>
                                  setStockEditing((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], dailyLimit: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => saveStockEdit(item)}
                                disabled={saving}
                                className="p-1.5 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => cancelStockEdit(item.id)}
                                disabled={saving}
                                className="p-1.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex flex-wrap items-center gap-3">
                            <span className="text-xs text-gray-400">
                              Stock:{' '}
                              <span className="font-medium text-gray-600">
                                {item.stock != null ? item.stock : '∞'}
                              </span>
                            </span>
                            <span className="text-xs text-gray-400">
                              Límite/día:{' '}
                              <span className="font-medium text-gray-600">
                                {item.dailyLimit != null ? `${item.dailyLimit}` : '∞'}
                              </span>
                              {item.dailyLimit != null && item.dailySold != null && item.dailySold > 0 && (
                                <span className="text-gray-400 ml-1">({item.dailySold} hoy)</span>
                              )}
                            </span>
                            <button
                              onClick={() => startStockEdit(item)}
                              className="text-xs text-orange-500 hover:underline"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleItem(item)}
                          className="flex items-center gap-1.5 text-sm transition-all px-2 py-1 rounded-lg hover:bg-gray-50"
                        >
                          {item.isAvailable ? (
                            <ToggleRight size={22} className="text-green-500" />
                          ) : (
                            <ToggleLeft size={22} className="text-gray-300" />
                          )}
                          <span className={`text-xs font-medium ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                            {item.isAvailable ? 'Disponible' : 'Agotado'}
                          </span>
                        </button>
                        <button
                          onClick={() => startProductEdit(item)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 px-2 py-1 rounded-lg hover:bg-orange-50 transition-all"
                        >
                          <Pencil size={11} />
                          Editar
                        </button>
                      </div>
                    </div>
                    {/* Product edit form */}
                    {productEditing[item.id] && (() => {
                      const pe = productEditing[item.id];
                      const saving = updateMenuItem.isPending;
                      return (
                        <div className="px-3 pb-3 pt-0 border-t border-gray-100 space-y-2 mt-0 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Nombre</label>
                              <input
                                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                value={pe.name}
                                onChange={(e) => setProductEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], name: e.target.value } }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-0.5">Precio</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                                value={pe.price}
                                onChange={(e) => setProductEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], price: e.target.value } }))}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">Descripción</label>
                            <input
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                              value={pe.description}
                              onChange={(e) => setProductEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], description: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">URL de imagen</label>
                            <input
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                              value={pe.imageUrl}
                              placeholder="https://..."
                              onChange={(e) => setProductEditing((prev) => ({ ...prev, [item.id]: { ...prev[item.id], imageUrl: e.target.value } }))}
                            />
                          </div>
                          <div className="flex justify-end gap-1 pt-1">
                            <button
                              onClick={() => cancelProductEdit(item.id)}
                              disabled={saving}
                              className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveProductEdit(item)}
                              disabled={saving}
                              className="px-3 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                            >
                              {saving ? 'Guardando…' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 py-3 text-center">Sin items en esta categoría</p>
              )}
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <p className="text-center text-gray-400 py-8">No hay categorías de menú. Agrega items para comenzar.</p>
        </Card>
      )}
    </div>
  );
}
