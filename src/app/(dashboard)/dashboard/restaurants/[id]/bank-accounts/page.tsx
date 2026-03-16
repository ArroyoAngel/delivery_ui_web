'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useRestaurantBankAccounts } from '@/hooks/useFinance';

function maskAccount(account: string) {
  if (!account) return '—';
  if (account.length <= 4) return account;
  return `${'*'.repeat(Math.max(0, account.length - 4))}${account.slice(-4)}`;
}

export default function RestaurantBankAccountsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: accounts = [], isLoading } = useRestaurantBankAccounts(id);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <Card title="Cuentas bancarias del restaurante">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 pr-3">Titular</th>
                <th className="py-3 pr-3">Banco</th>
                <th className="py-3 pr-3">Cuenta</th>
                <th className="py-3 pr-3">Tipo</th>
                <th className="py-3">Predeterminada</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    Sin cuentas bancarias registradas
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 text-gray-700">
                    <td className="py-3 pr-3">{a.account_holder}</td>
                    <td className="py-3 pr-3">{a.bank_name}</td>
                    <td className="py-3 pr-3">{maskAccount(a.account_number)}</td>
                    <td className="py-3 pr-3">{a.account_type}</td>
                    <td className="py-3">{a.is_default ? 'Sí' : 'No'}</td>
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
