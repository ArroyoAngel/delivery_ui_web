'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import { useRestaurant, useUpdateMenuItemAvailability } from '@/hooks/useRestaurants';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/models';
import toast from 'react-hot-toast';

export default function RestaurantMenuPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: restaurant, isLoading } = useRestaurant(params.id);
  const updateAvailability = useUpdateMenuItemAvailability();

  if (isLoading) return <PageLoader />;
  if (!restaurant) return <p className="text-gray-500 p-8">Restaurante no encontrado</p>;

  async function handleToggleItem(item: MenuItem) {
    try {
      await updateAvailability.mutateAsync({
        restaurantId: params.id,
        itemId: item.id,
        isAvailable: !item.isAvailable,
      });
      toast.success(
        `${item.name} ${!item.isAvailable ? 'habilitado' : 'deshabilitado'}`
      );
    } catch {
      toast.error('Error al actualizar item');
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
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
          onClick={() => router.push(`/dashboard/restaurants/${params.id}/menu/new`)}
        >
          <Plus size={14} />
          Agregar item
        </Button>
      </div>

      {/* Restaurant info */}
      <Card>
        <div className="flex gap-4 items-center">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
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
                category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
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
                    </div>

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
                  </div>
                ))
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
