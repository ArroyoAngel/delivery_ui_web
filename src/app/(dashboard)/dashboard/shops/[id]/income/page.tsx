'use client';

import { useParams } from 'next/navigation';
import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useShopIncomeSummary } from '@/hooks/useFinance';
import { ShoppingBag, Wallet, HandCoins, ArrowDownToLine } from 'lucide-react';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

export default function ShopIncomePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useShopIncomeSummary(id);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard
          label="Saldo disponible"
          value={money.format(Number(data?.available_balance ?? 0))}
          icon={<ArrowDownToLine size={20} />}
        />
      </div>

      <Card title="Estado de retiros">
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">En proceso de pago</p>
            <p className="text-lg font-semibold text-gray-900">
              {money.format(Number(data?.pending_withdrawals_amount ?? 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Disponible para retirar</p>
            <p className="text-lg font-semibold text-indigo-600">
              {money.format(Number(data?.available_balance ?? 0))}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
