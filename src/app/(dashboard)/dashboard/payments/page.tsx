'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, Clock, XCircle, Coins, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const money = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });

interface CreditPurchase {
  id: string;
  rider_id: string;
  payment_reference: string;
  credits_granted: number;
  amount_paid: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  created_at: string;
  package_name: string;
  first_name: string;
  last_name: string;
}

function StatusBadge({ status }: { status: CreditPurchase['status'] }) {
  const map = {
    pending:   { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmado', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelado',  cls: 'bg-gray-100 text-gray-500' },
    expired:   { label: 'Expirado',   cls: 'bg-red-100 text-red-500' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [onlyPending, setOnlyPending] = useState(true);

  const { data: purchases = [], isLoading } = useQuery<CreditPurchase[]>({
    queryKey: ['credit-purchases'],
    queryFn: async () => {
      const { data } = await api.get('/api/credits/admin/purchases');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });

  const confirm = useMutation({
    mutationFn: async (reference: string) => {
      await api.post(`/api/credits/admin/confirm/${reference}`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-purchases'] });
      toast.success('Pago confirmado — créditos acreditados');
    },
    onError: () => toast.error('Error al confirmar el pago'),
  });

  const pendingCount  = purchases.filter((p) => p.status === 'pending').length;
  const confirmedCount = purchases.filter((p) => p.status === 'confirmed').length;
  const totalAmount   = purchases
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.amount_paid), 0);

  const filtered = onlyPending ? purchases.filter((p) => p.status === 'pending') : purchases;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total compras"
          value={purchases.length}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          label="Monto cobrado"
          value={money.format(totalAmount)}
          icon={<Coins size={20} />}
        />
        <StatCard
          label="Pendientes"
          value={pendingCount}
          icon={<Clock size={20} />}
        />
        <StatCard
          label="Confirmadas"
          value={confirmedCount}
          icon={<CheckCircle size={20} />}
        />
      </div>

      <Card
        title={pendingCount > 0 ? `Compras de créditos (${pendingCount} pendientes)` : 'Compras de créditos'}
        action={
          <button
            onClick={() => setOnlyPending((v) => !v)}
            className="text-xs font-medium text-orange-600 hover:underline"
          >
            {onlyPending ? 'Ver todas' : 'Solo pendientes'}
          </button>
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-3">Rider</th>
                  <th className="py-3 pr-3">Paquete</th>
                  <th className="py-3 pr-3">Monto</th>
                  <th className="py-3 pr-3">Créditos</th>
                  <th className="py-3 pr-3">Referencia</th>
                  <th className="py-3 pr-3">Estado</th>
                  <th className="py-3 pr-3">Fecha</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">
                      {onlyPending ? 'No hay compras pendientes' : 'No hay compras registradas'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 text-gray-700">
                      <td className="py-3 pr-3 font-medium">{p.first_name} {p.last_name}</td>
                      <td className="py-3 pr-3 text-gray-600">{p.package_name}</td>
                      <td className="py-3 pr-3">{money.format(Number(p.amount_paid))}</td>
                      <td className="py-3 pr-3 font-semibold text-orange-600">{p.credits_granted}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-gray-400">{p.payment_reference}</td>
                      <td className="py-3 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3 pr-3 text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString('es-BO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="py-3">
                        {p.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => confirm.mutate(p.payment_reference)}
                            loading={confirm.isPending}
                          >
                            <CheckCircle size={13} />
                            Confirmar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
