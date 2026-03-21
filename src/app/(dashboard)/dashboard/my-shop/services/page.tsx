'use client';

import { useMemo, useState } from 'react';
import { Plus, Store, ShoppingBag, ReceiptText, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useMyShop } from '@/hooks/useShops';
import {
  useShopServiceAreas,
  useCreateShopServiceArea,
  useCreateLocalCashOrder,
} from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';

const RESTAURANT_AREA_KIND_OPTIONS = [
  { value: 'mesa',    label: 'Mesa' },
  { value: 'barra',   label: 'Barra' },
  { value: 'salon',   label: 'Salón' },
  { value: 'terraza', label: 'Terraza' },
];

const MARKET_AREA_KIND_OPTIONS = [
  { value: 'caja', label: 'Caja' },
];

type ServiceType = 'local' | 'recogida';

interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const maybe = error as { response?: { data?: { message?: unknown } } };
  const msg = maybe?.response?.data?.message;
  return typeof msg === 'string' ? msg : fallback;
}

export default function ShopServicesPage() {
  const [serviceType, setServiceType] = useState<ServiceType>('local');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedAreaLabel, setSelectedAreaLabel] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaKind, setNewAreaKind] = useState<'mesa' | 'barra' | 'salon' | 'terraza'>('mesa');
  const [cart, setCart] = useState<CartLine[]>([]);

  const { data: restaurant, isLoading: loadingRestaurant } = useMyShop();

  const isMarket = restaurant?.businessType === 'supermarket' || restaurant?.businessType === 'minimarket';
  const areaKindOptions = isMarket ? MARKET_AREA_KIND_OPTIONS : RESTAURANT_AREA_KIND_OPTIONS;
  const areaLabel = isMarket ? 'Caja / Mostrador' : 'Mesa / Área';
  const areaPlaceholder = isMarket ? 'Ej: Caja 2' : 'Ej: Mesa 8';
  const localLabel = isMarket ? 'Venta directa' : 'Consumo local';
  const serviceModeLabel = serviceType === 'local' ? localLabel : 'Recojo';
  const submitLabel = isMarket ? 'Registrar venta en efectivo' : 'Registrar orden en efectivo';
  const successMsg = isMarket ? 'Venta registrada en efectivo' : 'Orden registrada y confirmada en efectivo';
  const { data: areas = [], isLoading: loadingAreas } = useShopServiceAreas();
  const createArea = useCreateShopServiceArea();
  const createLocalOrder = useCreateLocalCashOrder();

  const menuItems = useMemo(() => {
    const categories = restaurant?.menuCategories ?? [];
    return categories.flatMap((cat) =>
      (cat.items ?? [])
        .filter((item) => item.isAvailable)
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          category: cat.name,
          stock: item.stock,
        })),
    );
  }, [restaurant]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [menuItems, search]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const itemsCount = cart.reduce((sum, line) => sum + line.quantity, 0);
    return { subtotal, itemsCount };
  }, [cart]);

  function addItem(menuItem: { id: string; name: string; price: number }) {
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === menuItem.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...prev, { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  }

  function changeQty(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function handleCreateArea() {
    const name = newAreaName.trim();
    if (!name) return;

    try {
      const created = await createArea.mutateAsync({ name, kind: newAreaKind });
      setNewAreaName('');
      setSelectedAreaId(created.id);
      setSelectedAreaLabel(created.name);
      toast.success('Área registrada');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el área'));
    }
  }

  async function handleSubmitOrder() {
    if (!cart.length) {
      toast.error('Agrega al menos un producto');
      return;
    }

    if (serviceType === 'local') {
      const selected = areas.find((a) => a.id === selectedAreaId);
      if (!selected && !selectedAreaLabel.trim()) {
        toast.error(`Seleccioná o escribí ${isMarket ? 'una caja/mostrador' : 'una mesa/área'}`);
        return;
      }
    }

    try {
      await createLocalOrder.mutateAsync({
        serviceType,
        areaId: selectedAreaId || undefined,
        areaLabel: selectedAreaLabel || undefined,
        notes: notes.trim() || undefined,
        items: cart.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
      });

      setCart([]);
      setNotes('');
      toast.success(successMsg);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar la orden'));
    }
  }

  if (loadingRestaurant) {
    return <div className="text-sm text-gray-500">Cargando servicios…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total efectivo"
          value={formatCurrency(totals.subtotal)}
          icon={<ReceiptText size={20} />}
        />
        <StatCard
          label="Modo de servicio"
          value={serviceModeLabel}
          icon={<Store size={20} />}
        />
        <StatCard
          label="Items en orden"
          value={totals.itemsCount}
          icon={<ShoppingBag size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        <Card title="Orden en curso">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setServiceType('local')}
                className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                  serviceType === 'local' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-700'
                }`}
              >
                {localLabel}
              </button>
              <button
                type="button"
                onClick={() => setServiceType('recogida')}
                className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                  serviceType === 'recogida' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-700'
                }`}
              >
                Recojo
              </button>
            </div>

            {serviceType === 'local' && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">{areaLabel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {areas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => {
                          setSelectedAreaId(area.id);
                          setSelectedAreaLabel(area.name);
                        }}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                          selectedAreaId === area.id ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                          <span className="text-xs font-medium text-gray-900">{area.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{area.kind}</p>
                      </button>
                    ))}
                  </div>
                  {loadingAreas && <p className="text-xs text-gray-500 mt-2">Cargando áreas…</p>}
                </div>

                <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <LayoutGrid size={13} /> Nueva área
                  </p>
                  <input
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    placeholder={areaPlaceholder}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newAreaKind}
                      onChange={(e) => setNewAreaKind(e.target.value as 'mesa' | 'barra' | 'salon' | 'terraza')}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg"
                    >
                      {areaKindOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={handleCreateArea} loading={createArea.isPending}>
                      <Plus size={14} />
                      Crear
                    </Button>
                  </div>
                </div>
              </>
            )}
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Total a cobrar (efectivo)</span>
                <span className="text-orange-700">{formatCurrency(totals.subtotal)}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">La orden se registra directamente en estado Confirmado.</p>
            </div>

            <Button
              className="w-full"
              loading={createLocalOrder.isPending}
              onClick={handleSubmitOrder}
              disabled={!cart.length}
            >
              {submitLabel}
            </Button>

            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {cart.map((line) => (
                <div key={line.menuItemId} className="border border-gray-200 rounded-lg p-2">
                  <p className="text-xs font-medium text-gray-900">{line.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{formatCurrency(line.price)}</span>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 rounded border text-xs" onClick={() => changeQty(line.menuItemId, -1)}>-</button>
                      <span className="text-xs w-4 text-center">{line.quantity}</span>
                      <button className="w-6 h-6 rounded border text-xs" onClick={() => changeQty(line.menuItemId, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-xs text-gray-500">No agregaste productos todavía.</p>}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas opcionales de la orden"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg min-h-20"
            />
          </div>
        </Card>
        <Card className="xl:col-span-2" title="Productos" action={
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto o categoría"
            className="w-64 px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
          />
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-3 hover:border-orange-300 transition-colors">
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-orange-600">{formatCurrency(item.price)}</span>
                  <Button size="sm" onClick={() => addItem(item)}>Agregar</Button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <p className="text-sm text-gray-500">No hay productos para mostrar.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
