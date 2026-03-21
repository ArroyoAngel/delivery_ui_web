'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  useAllCoupons,
  useShopCoupons,
  useCreateCouponSA,
  useCreateCouponShop,
  useToggleCouponSA,
  useToggleCouponShop,
  type Coupon,
} from '@/hooks/useCoupons';
import { useAuthStore } from '@/store/useAuthStore';
import { Tag, Plus, CheckCircle, XCircle, Shuffle } from 'lucide-react';

function randomCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O,0,I,1 para evitar confusión
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const TYPE_LABELS: Record<string, string> = {
  product_pct: '% producto',
  product_fixed: 'Fijo (Bs)',
  delivery_free: 'Delivery gratis',
};

const ABSORBS_LABELS: Record<string, string> = {
  platform: 'Plataforma',
  shop: 'Negocio',
};

// ── Modal SA ─────────────────────────────────────────────────────────────────

function NewCouponModalSA({ onClose }: { onClose: () => void }) {
  const create = useCreateCouponSA();
  const [form, setForm] = useState({
    code: '', description: '', type: 'product_pct', value: '',
    absorbsCost: 'platform', minOrderAmount: '', maxUses: '', expiresAt: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.code || !form.value) { toast.error('Código y valor son obligatorios'); return; }
    try {
      await create.mutateAsync({
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        absorbsCost: form.absorbsCost,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Cupón creado');
      onClose();
    } catch { toast.error('Error al crear el cupón'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900">Nuevo cupón de plataforma</h3>
        <p className="text-xs text-gray-500">Podés elegir cualquier tipo y quién absorbe el costo.</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Código * <span className="text-gray-400">(máx. 50 caracteres)</span></label>
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="BIENVENIDO10" maxLength={50} value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())} />
              <button type="button" title="Generar código aleatorio"
                onClick={() => set('code', randomCode())}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-colors">
                <Shuffle size={16} />
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="10% de descuento en primer pedido" value={form.description}
              onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo *</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="product_pct">% descuento en producto</option>
              <option value="product_fixed">Descuento fijo (Bs)</option>
              <option value="delivery_free">Delivery gratis</option>
            </select>
          </div>
          {form.type !== 'delivery_free' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {form.type === 'product_pct' ? 'Porcentaje (%)' : 'Monto (Bs)'} *
              </label>
              <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={form.type === 'product_pct' ? '10' : '5.00'} value={form.value}
                onChange={(e) => set('value', e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quién absorbe el costo</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.absorbsCost} onChange={(e) => set('absorbsCost', e.target.value)}>
              <option value="platform">Plataforma (yo asumo el costo)</option>
              <option value="shop">Negocio (se descuenta de su crédito)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pedido mínimo (Bs)</label>
            <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Opcional" value={form.minOrderAmount}
              onChange={(e) => set('minOrderAmount', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Máximo de usos</label>
            <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Sin límite" value={form.maxUses}
              onChange={(e) => set('maxUses', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Expira el</label>
            <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={create.isPending}>Crear cupón</Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Admin de negocio ────────────────────────────────────────────────────

function NewCouponModalShop({ onClose }: { onClose: () => void }) {
  const create = useCreateCouponShop();
  const [form, setForm] = useState({
    code: '', description: '', type: 'product_pct' as 'product_pct' | 'product_fixed',
    value: '', minOrderAmount: '', maxUses: '', expiresAt: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  async function handleSave() {
    if (!form.code || !form.value) { toast.error('Código y valor son obligatorios'); return; }
    try {
      await create.mutateAsync({
        code: form.code.toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Cupón creado');
      onClose();
    } catch { toast.error('Error al crear el cupón'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900">Nuevo cupón de mi negocio</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          El descuento se descuenta de tu crédito en la plataforma. No se puede hacer delivery gratis desde esta opción.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Código * <span className="text-gray-400">(máx. 50 caracteres)</span></label>
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="PIZZA20" maxLength={50} value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())} />
              <button type="button" title="Generar código aleatorio"
                onClick={() => set('code', randomCode())}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-300 transition-colors">
                <Shuffle size={16} />
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="20% en pizzas este fin de semana" value={form.description}
              onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo *</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="product_pct">% descuento en producto</option>
              <option value="product_fixed">Descuento fijo (Bs)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {form.type === 'product_pct' ? 'Porcentaje (%)' : 'Monto (Bs)'} *
            </label>
            <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder={form.type === 'product_pct' ? '20' : '10.00'} value={form.value}
              onChange={(e) => set('value', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Pedido mínimo (Bs)</label>
            <input type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Opcional" value={form.minOrderAmount}
              onChange={(e) => set('minOrderAmount', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Máximo de usos</label>
            <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Sin límite" value={form.maxUses}
              onChange={(e) => set('maxUses', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Expira el</label>
            <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={create.isPending}>Crear cupón</Button>
        </div>
      </div>
    </div>
  );
}

// ── Tabla compartida ──────────────────────────────────────────────────────────

function CouponsTable({
  coupons,
  onToggle,
  toggling,
}: {
  coupons: Coupon[];
  onToggle: (c: Coupon) => void;
  toggling: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-3 pr-3">Código</th>
            <th className="py-3 pr-3">Tipo</th>
            <th className="py-3 pr-3">Valor</th>
            <th className="py-3 pr-3">Absorbe</th>
            <th className="py-3 pr-3">Usos</th>
            <th className="py-3 pr-3">Expira</th>
            <th className="py-3 pr-3">Estado</th>
            <th className="py-3">Acción</th>
          </tr>
        </thead>
        <tbody>
          {coupons.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-gray-400">Sin cupones</td></tr>
          )}
          {coupons.map((c) => (
            <tr key={c.id} className="border-b border-gray-50 text-gray-700 hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-orange-500 flex-shrink-0" />
                  <span className="font-mono font-semibold text-gray-900">{c.code}</span>
                </div>
                {c.description && <p className="text-xs text-gray-400 mt-0.5 ml-5">{c.description}</p>}
              </td>
              <td className="py-3 pr-3 text-xs">{TYPE_LABELS[c.type] ?? c.type}</td>
              <td className="py-3 pr-3 font-medium">
                {c.type === 'delivery_free' ? '100%' : c.type === 'product_pct' ? `${Number(c.value)}%` : `Bs ${Number(c.value).toFixed(2)}`}
              </td>
              <td className="py-3 pr-3 text-xs">{ABSORBS_LABELS[c.absorbsCost] ?? c.absorbsCost}</td>
              <td className="py-3 pr-3 text-xs text-gray-500">
                {c.usesCount}{c.maxUses != null ? ` / ${c.maxUses}` : ''}
              </td>
              <td className="py-3 pr-3 text-xs text-gray-400">
                {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-BO') : '—'}
              </td>
              <td className="py-3 pr-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3">
                <button onClick={() => onToggle(c)} disabled={toggling}
                  className={`text-xs font-medium transition-colors ${c.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}>
                  {c.isActive
                    ? <span className="flex items-center gap-1"><XCircle size={14} /> Desactivar</span>
                    : <span className="flex items-center gap-1"><CheckCircle size={14} /> Activar</span>}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CouponsPage() {
  const { user } = useAuthStore();
  const isSA = user?.roles.includes('superadmin') ?? false;

  const saQuery = useAllCoupons(isSA);
  const shopQuery = useShopCoupons(!isSA);
  const toggleSA = useToggleCouponSA();
  const toggleShop = useToggleCouponShop();

  const [showNew, setShowNew] = useState(false);

  const coupons = isSA ? (saQuery.data ?? []) : (shopQuery.data ?? []);
  const isLoading = isSA ? saQuery.isLoading : shopQuery.isLoading;

  if (isLoading) return <PageLoader />;

  const active = coupons.filter((c) => c.isActive).length;

  async function handleToggle(c: Coupon) {
    try {
      if (isSA) {
        await toggleSA.mutateAsync({ id: c.id, active: !c.isActive });
      } else {
        await toggleShop.mutateAsync({ id: c.id, active: !c.isActive });
      }
      toast.success(c.isActive ? 'Cupón desactivado' : 'Cupón activado');
    } catch { toast.error('Error al actualizar el cupón'); }
  }

  return (
    <div className="space-y-5">
      {showNew && isSA && <NewCouponModalSA onClose={() => setShowNew(false)} />}
      {showNew && !isSA && <NewCouponModalShop onClose={() => setShowNew(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cupones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {active} activo{active !== 1 ? 's' : ''} · {coupons.length} en total
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={16} className="mr-1.5" />
          Nuevo cupón
        </Button>
      </div>

      <Card title={isSA ? 'Todos los cupones' : 'Cupones de mi negocio'}>
        <CouponsTable
          coupons={coupons}
          onToggle={handleToggle}
          toggling={toggleSA.isPending || toggleShop.isPending}
        />
      </Card>
    </div>
  );
}
