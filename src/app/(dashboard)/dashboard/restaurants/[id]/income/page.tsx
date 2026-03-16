'use client';

import { useParams } from 'next/navigation';
import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useRestaurantIncomeSummary } from '@/hooks/useFinance';
import { ShoppingBag, Wallet, HandCoins } from 'lucide-react';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

export default function RestaurantIncomePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useRestaurantIncomeSummary(id);

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

      <Card title="Retiros pendientes">
        <p className="text-sm text-gray-600">
          Monto pendiente de retiro:{' '}
          <span className="font-semibold text-gray-900">
            {money.format(Number(data?.pending_withdrawals_amount ?? 0))}
          </span>
        </p>
      </Card>
    </div>
  );
}
