'use client';

import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useFinanceSummary, useWithdrawals, useMyWithdrawals } from '@/hooks/useFinance';
import { useAuthStore } from '@/store/useAuthStore';
import { Clock3, HandCoins } from 'lucide-react';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

// ── Vista admin (propios retiros) ──────────────────────────────────────────

function AdminWithdrawalsPage() {
  const { data: withdrawals = [], isLoading } = useMyWithdrawals(100);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <Card title="Mis retiros">
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
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3">{w.status}</td>
                  <td className="py-3 pr-3">{money.format(Number(w.amount ?? 0))}</td>
                  <td className="py-3 pr-3">{w.bank_name ?? '—'}</td>
                  <td className="py-3 pr-3">{w.account_number ?? '—'}</td>
                  <td className="py-3">{new Date(w.requested_at).toLocaleString('es-BO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Vista superadmin (todos los retiros) ────────────────────────────────────

function SuperAdminWithdrawalsPage() {
  const { data: summary, isLoading: loadingSummary } = useFinanceSummary();
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useWithdrawals(100);

  if (loadingSummary || loadingWithdrawals) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Retiros Pendientes"
          value={summary?.withdrawals?.pending_withdrawals ?? 0}
          icon={<Clock3 size={20} />}
        />
        <StatCard
          label="Monto Pendiente"
          value={money.format(Number(summary?.withdrawals?.pending_withdrawals_amount ?? 0))}
          icon={<HandCoins size={20} />}
        />
      </div>

      <Card title="Solicitudes de retiro">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 pr-3">Estado</th>
                <th className="py-3 pr-3">Tipo</th>
                <th className="py-3 pr-3">Dueño</th>
                <th className="py-3 pr-3">Monto</th>
                <th className="py-3 pr-3">Banco</th>
                <th className="py-3 pr-3">Cuenta</th>
                <th className="py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3">{w.status}</td>
                  <td className="py-3 pr-3">{w.owner_type}</td>
                  <td className="py-3 pr-3">{w.owner_name ?? '—'}</td>
                  <td className="py-3 pr-3">{money.format(Number(w.amount ?? 0))}</td>
                  <td className="py-3 pr-3">{w.bank_name ?? '—'}</td>
                  <td className="py-3 pr-3">{w.account_number ?? '—'}</td>
                  <td className="py-3">{new Date(w.requested_at).toLocaleString('es-BO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function WithdrawalsPage() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  return isSuperAdmin ? <SuperAdminWithdrawalsPage /> : <AdminWithdrawalsPage />;
}
