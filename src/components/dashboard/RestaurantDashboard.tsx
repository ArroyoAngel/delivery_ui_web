'use client';

import { useState, useEffect } from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ShoppingBag, DollarSign, Bike, Store } from 'lucide-react';
import { StatCard, Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { useOrders } from '@/hooks/useOrders';
import SalesHeatmap from '@/components/dashboard/SalesHeatmap';
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/lib/utils';

const STATUS_CHART_COLORS: Record<string, string> = {
  pendiente: '#fbbf24',
  confirmado: '#60a5fa',
  preparando: '#a78bfa',
  listo: '#818cf8',
  en_camino: '#fb923c',
  entregado: '#34d399',
  cancelado: '#f87171',
};

const REVENUE_STATUSES = new Set([
  'confirmado',
  'preparando',
  'listo',
  'en_camino',
  'entregado',
]);

export default function RestaurantDashboard() {
  const { data: orders, isLoading } = useOrders();
  const [viewMode, setViewMode] = useState<'orders' | 'products'>('orders');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isLoading || !mounted) return <PageLoader />;

  const safeOrders = orders ?? [];

  // Build stats
  const today = new Date().toDateString();
  const todayOrders = safeOrders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const revenueToday = todayOrders
    .filter((o) => REVENUE_STATUSES.has(o.status))
    .reduce((acc, o) => acc + Number(o.total), 0);

  const paidOrders = safeOrders.filter((o) => REVENUE_STATUSES.has(o.status));

  // Orders by status
  const statusCounts = safeOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status,
    count,
    fill: STATUS_CHART_COLORS[status] ?? '#94a3b8',
  }));

  // Revenue last 7 days
  const last7: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
    const revenue = safeOrders
      .filter(
        (o) =>
          new Date(o.createdAt).toDateString() === d.toDateString() &&
          REVENUE_STATUSES.has(o.status)
      )
      .reduce((acc, o) => acc + Number(o.total), 0);
    last7.push({ date: label, revenue });
  }

  // Products purchased analytics
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of paidOrders) {
    for (const item of order.items ?? []) {
      const productName = item.menuItem?.name ?? 'Producto';
      const key = `${item.menuItem?.id || productName}`;
      const current = productMap.get(key) ?? { name: productName, qty: 0, revenue: 0 };
      current.qty += Number(item.quantity ?? 0);
      current.revenue += Number(item.unit_price ?? 0) * Number(item.quantity ?? 0);
      productMap.set(key, current);
    }
  }

  const productData = [...productMap.values()].sort((a, b) => b.qty - a.qty);
  const topProductsBar = productData.slice(0, 8).map((p) => ({
    product: p.name,
    qty: p.qty,
    revenue: p.revenue,
  }));
  const topProductsPie = productData.slice(0, 5).map((p, i) => ({
    name: p.name,
    value: p.qty,
    fill: ['#f97316', '#fb923c', '#fdba74', '#60a5fa', '#34d399'][i % 5],
  }));

  const productsSoldToday = todayOrders
    .filter((o) => REVENUE_STATUSES.has(o.status))
    .reduce(
      (acc, o) =>
        acc + (o.items ?? []).reduce((sum, it) => sum + Number(it.quantity ?? 0), 0),
      0
    );

  const averageTicket = paidOrders.length
    ? paidOrders.reduce((acc, o) => acc + Number(o.total), 0) / paidOrders.length
    : 0;

  return (
    <div className="space-y-6">
      {/* View Mode */}
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('orders')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === 'orders'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ver por pedidos
          </button>
          <button
            onClick={() => setViewMode('products')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${
              viewMode === 'products'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ver por productos
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {viewMode === 'orders' ? (
          <StatCard
            label="Pedidos hoy"
            value={todayOrders.length}
            icon={<ShoppingBag size={22} />}
            trend="del total"
          />
        ) : (
          <StatCard
            label="Productos vendidos hoy"
            value={productsSoldToday}
            icon={<ShoppingBag size={22} />}
            trend="unidades"
          />
        )}
        <StatCard
          label="Ingresos hoy"
          value={formatCurrency(revenueToday)}
          icon={<DollarSign size={22} />}
          trendUp={revenueToday > 0}
        />
        {viewMode === 'orders' ? (
          <>
            <StatCard
              label="Pedidos totales"
              value={safeOrders.length}
              icon={<Store size={22} />}
            />
            <StatCard
              label="Pendientes"
              value={statusCounts['pendiente'] ?? 0}
              icon={<Bike size={22} />}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Productos únicos vendidos"
              value={productData.length}
              icon={<Store size={22} />}
            />
            <StatCard
              label="Ticket promedio"
              value={formatCurrency(averageTicket)}
              icon={<Bike size={22} />}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Ingresos últimos 7 días">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last7} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(v: number) => `Bs${v}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Ingresos']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {viewMode === 'orders' ? (
          <Card title="Pedidos por estado">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
                  )}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card title="Productos más comprados (Top 5)">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={topProductsPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {topProductsPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
                  )}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Bar chart full width */}
      <Card
        title={
          viewMode === 'orders'
            ? 'Distribución de pedidos por estado'
            : 'Top productos por unidades vendidas'
        }
      >
        {viewMode === 'orders' ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Pedidos" radius={[4, 4, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={topProductsBar}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="product" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="qty" name="Unidades" radius={[4, 4, 0, 0]}>
                {topProductsBar.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#f97316" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Mapa de calor de ventas por zona">
        <SalesHeatmap orders={safeOrders} viewMode={viewMode} />
      </Card>
    </div>
  );
}
