'use client';

import { useState } from 'react';
import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  useMyIncomeSummary,
  useFinanceSummary,
  useMyBankAccounts,
  useMyWithdrawals,
  useRequestWithdrawal,
} from '@/hooks/useFinance';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ShoppingBag,
  Wallet,
  HandCoins,
  CreditCard,
  Clock3,
  ArrowDownToLine,
  TrendingUp,
  Percent,
  Bike,
} from 'lucide-react';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

// ── Modal de solicitud de retiro ───────────────────────────────────────────────

function WithdrawalModal({
  available,
  onClose,
}: {
  available: number;
  onClose: () => void;
}) {
  const { data: bankAccounts = [] } = useMyBankAccounts();
  const mutation = useRequestWithdrawal();
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError('Ingresa un monto válido');
    if (amt > available) return setError(`Máximo disponible: Bs ${available.toFixed(2)}`);
    if (!bankAccountId) return setError('Selecciona una cuenta bancaria');
    try {
      await mutation.mutateAsync({ amount: amt, bankAccountId });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al solicitar retiro');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Solicitar retiro</h2>
        <p className="text-sm text-gray-500 mb-5">
          Saldo disponible:{' '}
          <span className="font-semibold text-gray-900">{money.format(available)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Bs)</label>
            <input
              type="number"
              min="1"
              max={available}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: 150.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta bancaria</label>
            {bankAccounts.length === 0 ? (
              <p className="text-sm text-red-500">No tienes cuentas bancarias registradas. Agrégalas en "Cuentas bancarias".</p>
            ) : (
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar cuenta...</option>
                {bankAccounts.map((ba) => (
                  <option key={ba.id} value={ba.id}>
                    {ba.bank_name} — {ba.account_number} ({ba.account_holder})
                  </option>
                ))}
              </select>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || bankAccounts.length === 0}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Enviando...' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
    rejected:  { label: 'Rechazado',  cls: 'bg-red-100 text-red-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ── Vista para admin (propio negocio) ─────────────────────────────────────────

function AdminIncomePage() {
  const { data, isLoading } = useMyIncomeSummary();
  const { data: withdrawals = [], isLoading: loadingW } = useMyWithdrawals();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) return <PageLoader />;

  const available = Number(data?.available_balance ?? 0);

  return (
    <div className="space-y-5">
      {showModal && (
        <WithdrawalModal available={available} onClose={() => setShowModal(false)} />
      )}

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
          value={money.format(available)}
          icon={<ArrowDownToLine size={20} />}
        />
      </div>

      <Card title="Saldo y retiros">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-600">
              En proceso de pago:{' '}
              <span className="font-semibold text-gray-900">
                {money.format(Number(data?.pending_withdrawals_amount ?? 0))}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              1 crédito = Bs 1 · El superadministrador procesa los retiros manualmente
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={available <= 0}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine size={16} />
            Solicitar retiro
          </button>
        </div>
      </Card>

      <Card title="Historial de retiros">
        {loadingW ? (
          <PageLoader />
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no has solicitado retiros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Monto</th>
                  <th className="pb-2 pr-4">Cuenta</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-gray-600">
                      {new Date(w.requested_at).toLocaleDateString('es-BO')}
                    </td>
                    <td className="py-2 pr-4 font-semibibold text-gray-900">
                      {money.format(Number(w.amount))}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">
                      {w.bank_name ?? '—'}{w.account_number ? ` ···${w.account_number.slice(-4)}` : ''}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Vista para superadmin (resumen global) ────────────────────────────────────

function SuperAdminIncomePage() {
  const { data, isLoading } = useFinanceSummary();

  if (isLoading) return <PageLoader />;

  const platform = data?.platform;
  const totalEarned      = Number(platform?.total_earned ?? 0);
  const commissionEarned = Number(platform?.commission_earned ?? 0);
  const feeEarned        = Number(platform?.fee_earned ?? 0);
  const pendingRider     = Number(platform?.pending_rider_payout ?? 0);
  const paidOut          = Number(data?.withdrawals?.paid_out_amount ?? 0);

  return (
    <div className="space-y-6">

      {/* ── Ganancias de la plataforma ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Ganancias de la plataforma
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Ganancia total"
            value={money.format(totalEarned)}
            icon={<TrendingUp size={20} />}
          />
          <StatCard
            label="De comisiones a negocios"
            value={money.format(commissionEarned)}
            icon={<Percent size={20} />}
          />
          <StatCard
            label="De cargos de servicio"
            value={money.format(feeEarned)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Pendiente de pagar a riders"
            value={money.format(pendingRider)}
            icon={<Bike size={20} />}
          />
        </div>
      </div>

      {/* ── Retiros de negocios y riders ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Retiros de negocios y riders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Retiros pendientes"
            value={money.format(Number(data?.withdrawals?.pending_withdrawals_amount ?? 0))}
            icon={<Clock3 size={20} />}
          />
          <StatCard
            label="Total ya pagado"
            value={money.format(paidOut)}
            icon={<ArrowDownToLine size={20} />}
          />
          <StatCard
            label="Solicitudes pendientes"
            value={data?.withdrawals?.pending_withdrawals ?? 0}
            icon={<HandCoins size={20} />}
          />
        </div>
      </div>

      {/* ── Volumen global del sistema ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Volumen global del sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Pagos confirmados"
            value={data?.confirmed_payments ?? 0}
            icon={<CreditCard size={20} />}
          />
          <StatCard
            label="Monto total recaudado"
            value={money.format(Number(data?.total_amount ?? 0))}
            icon={<ShoppingBag size={20} />}
          />
          <StatCard
            label="Pagos pendientes de confirmar"
            value={data?.pending_payments ?? 0}
            icon={<Clock3 size={20} />}
          />
        </div>
      </div>

    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function IncomePage() {
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin());
  return isSuperAdmin ? <SuperAdminIncomePage /> : <AdminIncomePage />;
}
