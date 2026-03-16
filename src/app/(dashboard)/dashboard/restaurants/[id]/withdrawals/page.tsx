'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useRestaurantWithdrawals } from '@/hooks/useFinance';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

export default function RestaurantWithdrawalsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: withdrawals = [], isLoading } = useRestaurantWithdrawals(id, 100);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <Card title="Retiros del restaurante">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 pr-3">Estado</th>
                <th className="py-3 pr-3">Monto</th>
                <th className="py-3 pr-3">Banco</th>
                <th className="py-3 pr-3">Cuenta</th>
                <th className="py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    Sin solicitudes de retiro registradas
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-gray-50 text-gray-700">
                    <td className="py-3 pr-3">{w.status}</td>
                    <td className="py-3 pr-3">{money.format(Number(w.amount ?? 0))}</td>
                    <td className="py-3 pr-3">{w.bank_name ?? '—'}</td>
                    <td className="py-3 pr-3">{w.account_number ?? '—'}</td>
                    <td className="py-3">{new Date(w.requested_at).toLocaleString('es-BO')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
