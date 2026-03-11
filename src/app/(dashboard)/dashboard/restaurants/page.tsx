'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ToggleLeft, ToggleRight, UtensilsCrossed } from 'lucide-react';
import { useRestaurants, useToggleRestaurantOpen } from '@/hooks/useRestaurants';
import DataTable, { Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import type { Restaurant } from '@/models';
import toast from 'react-hot-toast';

export default function RestaurantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: restaurants, isLoading } = useRestaurants(search || undefined);
  const toggleOpen = useToggleRestaurantOpen();

  async function handleToggle(e: React.MouseEvent, restaurant: Restaurant) {
    e.stopPropagation();
    try {
      await toggleOpen.mutateAsync({ id: restaurant.id, isOpen: !restaurant.isOpen });
      toast.success(
        `${restaurant.name} ${!restaurant.isOpen ? 'abierto' : 'cerrado'}`
      );
    } catch {
      toast.error('Error al actualizar restaurante');
    }
  }

  const columns: Column<Restaurant>[] = [
    {
      key: 'imageUrl',
      label: '',
      render: (r) => (
        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {r.imageUrl ? (
            <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
          ) : (
            <UtensilsCrossed size={16} className="text-gray-300" />
          )}
        </div>
      ),
      className: 'w-14',
    },
    {
      key: 'name',
      label: 'Restaurante',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          <p className="text-xs text-gray-400 truncate max-w-[220px]">{r.address}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => (
        <span className="text-sm text-gray-700">
          ⭐ {Number(r.rating).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'deliveryFee',
      label: 'Delivery fee',
      render: (r) => (
        <span className="text-sm">{formatCurrency(Number(r.deliveryFee))}</span>
      ),
    },
    {
      key: 'deliveryTimeMin',
      label: 'Tiempo',
      render: (r) => (
        <span className="text-sm text-gray-600">{r.deliveryTimeMin} min</span>
      ),
    },
    {
      key: 'isOpen',
      label: 'Estado',
      render: (r) => (
        <button
          onClick={(e) => handleToggle(e, r)}
          className="flex items-center gap-1.5 text-sm transition-all"
        >
          {r.isOpen ? (
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
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/restaurants/${r.id}/menu`);
            }}
          >
            Menú
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar restaurante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/dashboard/restaurants/new')}
        >
          <Plus size={15} />
          Nuevo restaurante
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        {(restaurants ?? []).length} restaurante
        {(restaurants ?? []).length !== 1 ? 's' : ''}
      </p>

      <DataTable
        columns={columns}
        data={restaurants ?? []}
        keyField="id"
        loading={isLoading}
        emptyMessage="No se encontraron restaurantes"
        onRowClick={(r) => router.push(`/dashboard/restaurants/${r.id}`)}
      />
    </div>
  );
}
