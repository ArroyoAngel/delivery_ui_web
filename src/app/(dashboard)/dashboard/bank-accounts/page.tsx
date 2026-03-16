'use client';

import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useBankAccounts, useMyBankAccounts } from '@/hooks/useFinance';
import { useAuthStore } from '@/store/useAuthStore';

function maskAccount(account: string) {
  if (!account) return '—';
  if (account.length <= 4) return account;
  return `${'*'.repeat(Math.max(0, account.length - 4))}${account.slice(-4)}`;
}

// ── Vista admin (propio restaurante) ─────────────────────────────────────────

function AdminBankAccountsPage() {
  const { data: accounts = [], isLoading } = useMyBankAccounts();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <Card title="Mis cuentas bancarias">
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
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3">{a.account_holder}</td>
                  <td className="py-3 pr-3">{a.bank_name}</td>
                  <td className="py-3 pr-3">{maskAccount(a.account_number)}</td>
                  <td className="py-3 pr-3">{a.account_type}</td>
                  <td className="py-3">{a.is_default ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Vista superadmin (todas) ───────────────────────────────────────────────

function SuperAdminBankAccountsPage() {
  const { data: accounts = [], isLoading } = useBankAccounts();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <Card title="Cuentas bancarias registradas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 pr-3">Tipo</th>
                <th className="py-3 pr-3">Titular</th>
                <th className="py-3 pr-3">Dueño</th>
                <th className="py-3 pr-3">Banco</th>
                <th className="py-3 pr-3">Cuenta</th>
                <th className="py-3 pr-3">Tipo Cuenta</th>
                <th className="py-3">Predeterminada</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3">{a.owner_type}</td>
                  <td className="py-3 pr-3">{a.account_holder}</td>
                  <td className="py-3 pr-3">{a.owner_name ?? '—'}</td>
                  <td className="py-3 pr-3">{a.bank_name}</td>
                  <td className="py-3 pr-3">{maskAccount(a.account_number)}</td>
                  <td className="py-3 pr-3">{a.account_type}</td>
                  <td className="py-3">{a.is_default ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────

export default function BankAccountsPage() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  return isSuperAdmin ? <SuperAdminBankAccountsPage /> : <AdminBankAccountsPage />;
}
