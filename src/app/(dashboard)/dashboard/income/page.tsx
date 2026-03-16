'use client';

import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useMyIncomeSummary, useFinanceSummary } from '@/hooks/useFinance';
import { useAuthStore } from '@/store/useAuthStore';
import { ShoppingBag, Wallet, HandCoins, CreditCard, Clock3 } from 'lucide-react';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

// ── Vista para admin (propio restaurante) ─────────────────────────────────────

function AdminIncomePage() {
  const { data, isLoading } = useMyIncomeSummary();
  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Pedidos efectivos"
          value={data?.total_orders ?? 0}
          icon={<ShoppingBag size={20} />}
        />
        <StatCard
          label="Ventas brutas"
          value={money.format(Number(data?.gross_sales ?? 0))}
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Ingresos netos"
          value={money.format(Number(data?.net_income ?? 0))}
          icon={<HandCoins size={20} />}
        />
      </div>

      <Card title="Resumen de retiros">
        <p className="text-sm text-gray-600">
          Pendiente de retiro:{' '}
          <span className="font-semibold text-gray-900">
            {money.format(Number(data?.pending_withdrawals_amount ?? 0))}
          </span>
        </p>
      </Card>
    </div>
  );
}

// ── Vista para superadmin (resumen global) ────────────────────────────────────

function SuperAdminIncomePage() {
  const { data, isLoading } = useFinanceSummary();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total pagos"
          value={data?.total_payments ?? 0}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          label="Monto total"
          value={money.format(Number(data?.total_amount ?? 0))}
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Pagos pendientes"
          value={data?.pending_payments ?? 0}
          icon={<Clock3 size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Entradas de billetera"
          value={data?.wallet?.total_wallet_entries ?? 0}
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Créditos totales"
          value={money.format(Number(data?.wallet?.credits ?? 0))}
          icon={<HandCoins size={20} />}
        />
        <StatCard
          label="Débitos totales"
          value={money.format(Number(data?.wallet?.debits ?? 0))}
          icon={<HandCoins size={20} />}
        />
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function IncomePage() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  return isSuperAdmin ? <SuperAdminIncomePage /> : <AdminIncomePage />;
}
