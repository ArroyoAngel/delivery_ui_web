'use client';

import { useState } from 'react';
import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  useFinanceSummary,
  useWithdrawals,
  useMyWithdrawals,
  useProcessWithdrawal,
  type WithdrawalRow,
} from '@/hooks/useFinance';
import { useAuthStore } from '@/store/useAuthStore';
import { Clock3, HandCoins, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const money = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
});

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// ── Modal de procesamiento ─────────────────────────────────────────────────────

interface ProcessModalProps {
  withdrawal: WithdrawalRow;
  onClose: () => void;
}

function ProcessModal({ withdrawal, onClose }: ProcessModalProps) {
  const [action, setAction] = useState<'completed' | 'rejected'>('completed');
  const [transferId, setTransferId] = useState('');
  const [notes, setNotes] = useState('');
  const process = useProcessWithdrawal();

  async function handleSubmit() {
    try {
      await process.mutateAsync({
        id: withdrawal.id,
        action,
        externalTransferId: transferId || undefined,
        notes: notes || undefined,
      });
      toast.success(action === 'completed' ? 'Retiro aprobado' : 'Retiro rechazado');
      onClose();
    } catch {
      toast.error('Error al procesar el retiro');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Procesar solicitud de retiro</h3>

        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Solicitante:</span> {withdrawal.owner_name ?? '—'}</p>
          <p><span className="font-medium">Monto:</span> {money.format(Number(withdrawal.amount))}</p>
          <p><span className="font-medium">Banco:</span> {withdrawal.bank_name ?? '—'} · {withdrawal.account_number ?? '—'}</p>
        </div>

        {/* Acción */}
        <div className="flex gap-3">
          <button
            onClick={() => setAction('completed')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              action === 'completed'
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-200 text-gray-600 hover:border-green-400'
            }`}
          >
            Aprobar
          </button>
          <button
            onClick={() => setAction('rejected')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              action === 'rejected'
                ? 'bg-red-600 text-white border-red-600'
                : 'border-gray-200 text-gray-600 hover:border-red-400'
            }`}
          >
            Rechazar
          </button>
        </div>

        {action === 'completed' && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ID de transferencia externa (BNB)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Ej. BNB-TX-20260321-001"
              value={transferId}
              onChange={(e) => setTransferId(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Notas (opcional)</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            rows={2}
            placeholder={action === 'rejected' ? 'Motivo del rechazo...' : 'Observaciones...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            loading={process.isPending}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

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
                <th className="py-3 pr-3">Fecha solicitud</th>
                <th className="py-3">Fecha proceso</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    Sin solicitudes
                  </td>
                </tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[w.status] ?? w.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-medium">{money.format(Number(w.amount ?? 0))}</td>
                  <td className="py-3 pr-3">{w.bank_name ?? '—'}</td>
                  <td className="py-3 pr-3">{w.account_number ?? '—'}</td>
                  <td className="py-3 pr-3">{new Date(w.requested_at).toLocaleString('es-BO')}</td>
                  <td className="py-3">{w.processed_at ? new Date(w.processed_at).toLocaleString('es-BO') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Vista superadmin (todos los retiros + acciones) ─────────────────────────

function SuperAdminWithdrawalsPage() {
  const { data: summary, isLoading: loadingSummary } = useFinanceSummary();
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useWithdrawals(100);
  const [selected, setSelected] = useState<WithdrawalRow | null>(null);

  if (loadingSummary || loadingWithdrawals) return <PageLoader />;

  return (
    <div className="space-y-5">
      {selected && (
        <ProcessModal withdrawal={selected} onClose={() => setSelected(null)} />
      )}

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
                <th className="py-3 pr-3">Solicitante</th>
                <th className="py-3 pr-3">Monto</th>
                <th className="py-3 pr-3">Banco · Cuenta</th>
                <th className="py-3 pr-3">Fecha</th>
                <th className="py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    Sin solicitudes
                  </td>
                </tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 text-gray-700">
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[w.status] ?? w.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3 capitalize">{w.owner_type}</td>
                  <td className="py-3 pr-3">{w.owner_name ?? '—'}</td>
                  <td className="py-3 pr-3 font-medium">{money.format(Number(w.amount ?? 0))}</td>
                  <td className="py-3 pr-3">
                    {w.bank_name ?? '—'}{w.account_number ? ` · ${w.account_number}` : ''}
                  </td>
                  <td className="py-3 pr-3">{new Date(w.requested_at).toLocaleString('es-BO')}</td>
                  <td className="py-3">
                    {w.status === 'pending' ? (
                      <button
                        onClick={() => setSelected(w)}
                        className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Procesar
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {w.status === 'completed'
                          ? <><CheckCircle size={13} className="text-green-500" /> Procesado</>
                          : <><XCircle size={13} className="text-red-400" /> Rechazado</>
                        }
                      </span>
                    )}
                  </td>
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
