'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRestaurant } from '@/hooks/useRestaurants';
import { useCreateMenuItem, useCreateMenuCategory } from '@/hooks/useRestaurants';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function NewMenuItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: restaurant } = useRestaurant(id);
  const createItem = useCreateMenuItem();
  const createCategory = useCreateMenuCategory();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    size: '1',
    stock: '',
    dailyLimit: '',
    isAvailable: true,
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const categories = restaurant?.menuCategories ?? [];

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      await createCategory.mutateAsync({ restaurantId: id, name: newCategoryName.trim() });
      toast.success('Categoría creada');
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch {
      toast.error('Error al crear categoría');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) { toast.error('Seleccioná una categoría'); return; }
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { toast.error('El precio debe ser mayor a 0'); return; }

    try {
      await createItem.mutateAsync({
        restaurantId: id,
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        imageUrl: form.imageUrl.trim() || undefined,
        size: parseInt(form.size) || 1,
        stock: form.stock !== '' ? parseInt(form.stock) : null,
        dailyLimit: form.dailyLimit !== '' ? parseInt(form.dailyLimit) : null,
        isAvailable: form.isAvailable,
      });
      toast.success('Producto registrado');
      router.push(`/dashboard/restaurants/${id}/menu`);
    } catch {
      toast.error('Error al registrar el producto');
    }
  }

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/restaurants/${id}/menu`}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Registrar Producto</h1>
          {restaurant && (
            <p className="text-xs text-gray-400">{restaurant.name}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <div className="flex gap-2">
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            >
              <option value="">Seleccioná una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-500 text-sm flex items-center gap-1 transition-all"
            >
              <Plus size={14} /> Nueva
            </button>
          </div>
          {showNewCategory && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 transition-all"
              >
                {creatingCategory ? <Loader2 size={14} className="animate-spin" /> : 'Crear'}
              </button>
            </div>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Hamburguesa clásica"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descripción del producto (opcional)"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 resize-none"
          />
        </div>

        {/* Precio y Tamaño */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (Bs) *</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño (porciones)</label>
            <select
              value={form.size}
              onChange={(e) => set('size', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            >
              <option value="1">1 porción</option>
              <option value="2">2 porciones</option>
              <option value="3">3 porciones</option>
            </select>
          </div>
        </div>

        {/* Stock y Límite diario */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock inicial</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              placeholder="Indefinido"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            />
            <p className="text-xs text-gray-400 mt-0.5">Vacío = sin límite</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Límite diario</label>
            <input
              type="number"
              min="0"
              value={form.dailyLimit}
              onChange={(e) => set('dailyLimit', e.target.value)}
              placeholder="Sin límite"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            />
            <p className="text-xs text-gray-400 mt-0.5">Vacío = sin límite</p>
          </div>
        </div>

        {/* URL imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          />
        </div>

        {/* Disponible */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isAvailable"
            checked={form.isAvailable}
            onChange={(e) => set('isAvailable', e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <label htmlFor="isAvailable" className="text-sm text-gray-700">
            Disponible al publicar
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link
            href={`/dashboard/restaurants/${id}/menu`}
            className="flex-1 text-center py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createItem.isPending}
            className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {createItem.isPending && <Loader2 size={14} className="animate-spin" />}
            Registrar producto
          </button>
        </div>
      </form>
    </div>
  );
}
