'use client';

import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAdminPayments, useFinanceSummary } from '@/hooks/useFinance';
import { CreditCard, Clock3, CheckCircle2, Wallet } from 'lucide-react';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

function short(value: string | null) {
  if (!value) return '—';
  return value.length > 16 ? `${value.slice(0, 16)}...` : value;
}

export default function PaymentsPage() {
  const { data: summary, isLoading: loadingSummary } = useFinanceSummary();
  const { data: payments = [], isLoading: loadingPayments } = useAdminPayments(100);

  if (loadingSummary || loadingPayments) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Pagos"
          value={summary?.total_payments ?? 0}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          label="Monto Total"
          value={money.format(Number(summary?.total_amount ?? 0))}
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Pagos Pendientes"
          value={summary?.pending_payments ?? 0}
          icon={<Clock3 size={20} />}
        />
        <StatCard
          label="Pagos Confirmados"
          value={summary?.confirmed_payments ?? 0}
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <Card title="Últimos pagos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 pr-3">Referencia</th>
                <th className="py-3 pr-3">Tipo</th>
                <th className="py-3 pr-3">Estado</th>
                <th className="py-3 pr-3">Cliente</th>
                <th className="py-3 pr-3">Monto</th>
                <th className="py-3 pr-3">Banco</th>
                <th className="py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3 font-medium">{short(p.reference)}</td>
                  <td className="py-3 pr-3">{p.scope_type}</td>
                  <td className="py-3 pr-3">{p.status}</td>
                  <td className="py-3 pr-3">{p.payer_email ?? '—'}</td>
                  <td className="py-3 pr-3">{money.format(Number(p.total_amount ?? 0))}</td>
                  <td className="py-3 pr-3">{p.bank_provider ?? '—'}</td>
                  <td className="py-3">{new Date(p.requested_at).toLocaleString('es-BO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
