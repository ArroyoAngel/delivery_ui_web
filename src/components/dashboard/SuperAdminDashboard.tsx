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
  Legend,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  TrendingUp,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { StatCard, Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAllOrders } from '@/hooks/useAllOrders';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useUsers } from '@/hooks/useUsers';
import SalesHeatmap from '@/components/dashboard/SalesHeatmap';
import { formatCurrency } from '@/lib/utils';
import type { Order, Restaurant } from '@/models';

// ─── Constants ────────────────────────────────────────────────────────────────

const REVENUE_STATUSES = new Set([
  'confirmado',
  'preparando',
  'listo',
  'en_camino',
  'entregado',
]);

// ─── Types ────────────────────────────────────────────────────────────────────

type DatePreset = 'today' | 'week' | 'month' | 'custom';
type RankingMetric = 'revenue' | 'orders' | 'ticket';

interface RestaurantStat {
  restaurantId: string;
  name: string;
  revenue: number;
  orders: number;
  avgTicket: number;
  cancellations: number;
}

interface ProductStat {
  key: string;
  name: string;
  restaurantName: string;
  qty: number;
  revenue: number;
}

interface SystemAlert {
  type: 'drop' | 'cancellation';
  restaurantName: string;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (preset === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (preset === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (preset === 'month') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  // custom
  const start = customStart
    ? new Date(customStart)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const customEndDate = customEnd ? new Date(customEnd) : new Date(end);
  customEndDate.setHours(23, 59, 59, 999);
  return { start, end: customEndDate };
}

function getPrevRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string,
): { start: Date; end: Date } {
  const { start, end } = getRange(preset, customStart, customEnd);
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration - 1),
    end: new Date(start.getTime() - 1),
  };
}

function buildRestaurantStats(
  orders: Order[],
  restaurantMap: Map<string, Restaurant>,
): RestaurantStat[] {
  const map = new Map<string, { revenue: number; orders: number; cancellations: number }>();

  for (const order of orders) {
    const curr = map.get(order.restaurantId) ?? { revenue: 0, orders: 0, cancellations: 0 };
    curr.orders += 1;
    if (REVENUE_STATUSES.has(order.status)) {
      curr.revenue += Number(order.total);
    }
    if (order.status === 'cancelado') {
      curr.cancellations += 1;
    }
    map.set(order.restaurantId, curr);
  }

  return [...map.entries()].map(([id, stats]) => ({
    restaurantId: id,
    name: restaurantMap.get(id)?.name ?? `Restaurante ${id.slice(0, 8)}`,
    revenue: stats.revenue,
    orders: stats.orders,
    avgTicket: stats.orders > 0 ? stats.revenue / stats.orders : 0,
    cancellations: stats.cancellations,
  }));
}

function buildProductStats(
  orders: Order[],
  restaurantMap: Map<string, Restaurant>,
): ProductStat[] {
  const map = new Map<string, ProductStat>();

  for (const order of orders) {
    const restName =
      restaurantMap.get(order.restaurantId)?.name ??
      `Restaurante ${order.restaurantId.slice(0, 8)}`;

    for (const item of order.items ?? []) {
      const key = `${order.restaurantId}:${item.menuItemId || item.menuItem?.name}`;
      const curr = map.get(key) ?? {
        key,
        name: item.menuItem?.name ?? 'Producto',
        restaurantName: restName,
        qty: 0,
        revenue: 0,
      };
      curr.qty += Number(item.quantity ?? 0);
      curr.revenue += Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0);
      map.set(key, curr);
    }
  }

  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

function buildTrendData(
  orders: Order[],
  start: Date,
  end: Date,
  preset: DatePreset,
): { date: string; revenue: number; orders: number }[] {
  // Hourly for "today"
  if (preset === 'today') {
    return Array.from({ length: 24 }, (_, h) => {
      const hStart = new Date(start);
      hStart.setHours(h, 0, 0, 0);
      const hEnd = new Date(start);
      hEnd.setHours(h, 59, 59, 999);
      const dayOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= hStart && d <= hEnd;
      });
      return {
        date: `${h.toString().padStart(2, '0')}h`,
        revenue: dayOrders.reduce((acc, o) => acc + Number(o.total), 0),
        orders: dayOrders.length,
      };
    });
  }

  // Daily for week / month / custom (capped at 60 days)
  const result: { date: string; revenue: number; orders: number }[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  let iterations = 0;

  while (cursor <= end && iterations < 60) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);

    const dayOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= dayStart && d <= dayEnd;
    });

    result.push({
      date: cursor.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }),
      revenue: dayOrders.reduce((acc, o) => acc + Number(o.total), 0),
      orders: dayOrders.length,
    });

    cursor.setDate(cursor.getDate() + 1);
    iterations++;
  }

  return result;
}

function growthTrend(
  current: number,
  previous: number,
): { trend: string | undefined; trendUp: boolean } {
  if (previous === 0) return { trend: undefined, trendUp: true };
  const pct = ((current - previous) / previous) * 100;
  return {
    trend: `${Math.abs(pct).toFixed(1)}% vs. período anterior`,
    trendUp: pct >= 0,
  };
}

function truncateName(name: string, max = 22): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoy',
  week: 'Esta Semana',
  month: 'Este Mes',
  custom: 'Personalizado',
};

const RANKING_OPTIONS: [RankingMetric, string][] = [
  ['revenue', 'Ingresos'],
  ['orders', 'Pedidos'],
  ['ticket', 'Ticket Prom.'],
];

export default function SuperAdminDashboard() {
  const [preset, setPreset] = useState<DatePreset>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('revenue');
  const [mounted, setMounted] = useState(false);

  const { data: allOrders, isLoading: ordersLoading } = useAllOrders();
  const { data: restaurants, isLoading: restLoading } = useRestaurants();
  const { data: users, isLoading: usersLoading } = useUsers();

  useEffect(() => setMounted(true), []);

  if (!mounted || ordersLoading || restLoading || usersLoading) {
    return <PageLoader />;
  }

  const safeOrders = allOrders ?? [];
  const safeRestaurants = restaurants ?? [];
  const safeUsers = users ?? [];

  const restaurantMap = new Map(safeRestaurants.map((r) => [r.id, r]));

  // ─── Date ranges ───────────────────────────────────────────────────────────
  const { start, end } = getRange(preset, customStart, customEnd);
  const { start: prevStart, end: prevEnd } = getPrevRange(preset, customStart, customEnd);

  const filteredOrders = safeOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= start && d <= end;
  });

  const prevOrders = safeOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= prevStart && d <= prevEnd;
  });

  const paidOrders = filteredOrders.filter((o) => REVENUE_STATUSES.has(o.status));
  const prevPaidOrders = prevOrders.filter((o) => REVENUE_STATUSES.has(o.status));

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.total), 0);
  const prevRevenue = prevPaidOrders.reduce((acc, o) => acc + Number(o.total), 0);

  const totalOrders = filteredOrders.length;
  const prevTotalOrders = prevOrders.length;

  const activeRestaurantIds = new Set(paidOrders.map((o) => o.restaurantId));

  const avgTicket = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const prevAvgTicket = prevPaidOrders.length
    ? prevPaidOrders.reduce((acc, o) => acc + Number(o.total), 0) / prevPaidOrders.length
    : 0;

  const clientUsers = safeUsers.filter((u) => u.roles.includes('client'));
  const activeClientIds = new Set(filteredOrders.map((o) => o.clientId));

  // ─── Restaurant stats ──────────────────────────────────────────────────────
  const restaurantStats = buildRestaurantStats(filteredOrders, restaurantMap);
  const prevRestaurantStats = buildRestaurantStats(prevOrders, restaurantMap);

  const rankingData = [...restaurantStats]
    .sort((a, b) => {
      if (rankingMetric === 'revenue') return b.revenue - a.revenue;
      if (rankingMetric === 'orders') return b.orders - a.orders;
      return b.avgTicket - a.avgTicket;
    })
    .slice(0, 10)
    .map((r) => ({
      name: truncateName(r.name),
      value:
        rankingMetric === 'revenue'
          ? r.revenue
          : rankingMetric === 'orders'
          ? r.orders
          : r.avgTicket,
    }));

  // ─── Products ──────────────────────────────────────────────────────────────
  const allPaidOrders = safeOrders.filter((o) => REVENUE_STATUSES.has(o.status));
  const allProductStats = buildProductStats(allPaidOrders, restaurantMap);
  const periodProductStats = buildProductStats(paidOrders, restaurantMap);

  const topProducts = periodProductStats.slice(0, 10);
  const forgottenProducts = [...allProductStats]
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 10);

  // ─── Trend ─────────────────────────────────────────────────────────────────
  const trendData = buildTrendData(paidOrders, start, end, preset);

  // ─── Alerts ────────────────────────────────────────────────────────────────
  const alerts: SystemAlert[] = [];

  for (const curr of restaurantStats) {
    const prev = prevRestaurantStats.find((r) => r.restaurantId === curr.restaurantId);

    if (prev && prev.revenue > 0) {
      const drop = (prev.revenue - curr.revenue) / prev.revenue;
      if (drop > 0.3) {
        alerts.push({
          type: 'drop',
          restaurantName: curr.name,
          message: `Caída de ingresos del ${(drop * 100).toFixed(0)}% respecto al período anterior`,
        });
      }
    }

    if (curr.orders > 5 && curr.cancellations / curr.orders > 0.2) {
      alerts.push({
        type: 'cancellation',
        restaurantName: curr.name,
        message: `${((curr.cancellations / curr.orders) * 100).toFixed(0)}% de pedidos cancelados (${curr.cancellations} de ${curr.orders})`,
      });
    }
  }

  // ─── Growth badges ─────────────────────────────────────────────────────────
  const revGrowth = growthTrend(totalRevenue, prevRevenue);
  const ordGrowth = growthTrend(totalOrders, prevTotalOrders);
  const tickGrowth = growthTrend(avgTicket, prevAvgTicket);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header + Date filter ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vista Global del Sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Métricas agregadas de todos los restaurantes
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {(Object.keys(PRESET_LABELS) as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  preset === p
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Ingresos Totales"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={22} />}
          {...revGrowth}
        />
        <StatCard
          label="Total Pedidos"
          value={totalOrders}
          icon={<ShoppingBag size={22} />}
          {...ordGrowth}
        />
        <StatCard
          label="Restaurantes Activos"
          value={`${activeRestaurantIds.size} / ${safeRestaurants.length}`}
          icon={<Store size={22} />}
        />
        <StatCard
          label="Ticket Promedio Global"
          value={formatCurrency(avgTicket)}
          icon={<TrendingUp size={22} />}
          {...tickGrowth}
        />
        <StatCard
          label="Clientes Activos"
          value={activeClientIds.size}
          icon={<Users size={22} />}
          trend={`de ${clientUsers.length} registrados`}
        />
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                alert.type === 'drop'
                  ? 'bg-red-50 border-red-100'
                  : 'bg-amber-50 border-amber-100'
              }`}
            >
              {alert.type === 'drop' ? (
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
              ) : (
                <XCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    alert.type === 'drop' ? 'text-red-800' : 'text-amber-800'
                  }`}
                >
                  {alert.restaurantName}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    alert.type === 'drop' ? 'text-red-600' : 'text-amber-600'
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Trend Chart ──────────────────────────────────────────────── */}
      <Card title="Evolución de Ingresos y Pedidos">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v: number) => `Bs${v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value)) : value,
                name === 'revenue' ? 'Ingresos' : 'Pedidos',
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {value === 'revenue' ? 'Ingresos' : 'Pedidos'}
                </span>
              )}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name="orders"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Restaurant Ranking ───────────────────────────────────────── */}
      <Card
        title="Ranking de Restaurantes (Top 10)"
        action={
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {RANKING_OPTIONS.map(([m, label]) => (
              <button
                key={m}
                onClick={() => setRankingMetric(m)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                  rankingMetric === m
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {rankingData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            Sin datos para el período seleccionado
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, rankingData.length * 36)}>
            <BarChart
              data={rankingData}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v: number) =>
                  rankingMetric === 'orders' ? String(v) : `Bs${Math.round(v)}`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151' }}
                width={130}
              />
              <Tooltip
                formatter={(value) => [
                  rankingMetric === 'orders'
                    ? value
                    : formatCurrency(Number(value)),
                  rankingMetric === 'revenue'
                    ? 'Ingresos'
                    : rankingMetric === 'orders'
                    ? 'Pedidos'
                    : 'Ticket Prom.',
                ]}
              />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Products ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 */}
        <Card title="Top 10 Productos del Período">
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[380px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">
                    Producto
                  </th>
                  <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">
                    Restaurante
                  </th>
                  <th className="text-right py-2 pr-3 text-xs font-medium text-gray-500">
                    Cant.
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">
                    Ingresos
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                      Sin ventas en el período
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, i) => (
                    <tr
                      key={p.key}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2.5 pr-3 text-gray-400 font-medium text-xs">{i + 1}</td>
                      <td className="py-2.5 pr-3 font-medium text-gray-900 text-xs">
                        {p.name}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">
                        {truncateName(p.restaurantName, 18)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-orange-600 text-xs">
                        {p.qty}
                      </td>
                      <td className="py-2.5 text-right text-gray-700 text-xs">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Forgotten / low-sales */}
        <Card
          title="Productos con Pocas Ventas"
          action={
            <span className="text-xs text-gray-400 font-normal">Historial completo</span>
          }
        >
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">
                    Producto
                  </th>
                  <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500">
                    Restaurante
                  </th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">
                    Total vendido
                  </th>
                </tr>
              </thead>
              <tbody>
                {forgottenProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400 text-sm">
                      Sin datos
                    </td>
                  </tr>
                ) : (
                  forgottenProducts.map((p) => (
                    <tr
                      key={p.key}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2.5 pr-3 font-medium text-gray-900 text-xs">
                        {p.name}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs">
                        {truncateName(p.restaurantName, 18)}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          {p.qty} uds.
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Restaurant detail table ──────────────────────────────────── */}
      <Card title="Detalle por Restaurante">
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">
                  Restaurante
                </th>
                <th className="text-right py-2 pr-4 text-xs font-medium text-gray-500">
                  Pedidos
                </th>
                <th className="text-right py-2 pr-4 text-xs font-medium text-gray-500">
                  Ingresos
                </th>
                <th className="text-right py-2 pr-4 text-xs font-medium text-gray-500">
                  Ticket Prom.
                </th>
                <th className="text-right py-2 text-xs font-medium text-gray-500">
                  Cancelados
                </th>
              </tr>
            </thead>
            <tbody>
              {restaurantStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                    Sin pedidos en el período
                  </td>
                </tr>
              ) : (
                [...restaurantStats]
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((r) => {
                    const cancelRate =
                      r.orders > 0 ? (r.cancellations / r.orders) * 100 : 0;
                    return (
                      <tr
                        key={r.restaurantId}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-medium text-gray-900 text-xs">
                          {r.name}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-700 text-xs">
                          {r.orders}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-semibold text-orange-600 text-xs">
                          {formatCurrency(r.revenue)}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-700 text-xs">
                          {formatCurrency(r.avgTicket)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              cancelRate > 20
                                ? 'bg-red-50 text-red-700'
                                : cancelRate > 10
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {r.cancellations} ({cancelRate.toFixed(0)}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Delivery Heatmap ─────────────────────────────────────────── */}
      <Card title="Mapa de Calor de Zonas de Entrega">
        <p className="text-xs text-gray-500 mb-3">
          Concentración de entregas en el período seleccionado.
          {safeRestaurants.length > 0 && (
            <> Abarca {activeRestaurantIds.size} restaurante(s) activo(s).</>
          )}
        </p>
        <SalesHeatmap orders={paidOrders} viewMode="orders" />
      </Card>
    </div>
  );
}
