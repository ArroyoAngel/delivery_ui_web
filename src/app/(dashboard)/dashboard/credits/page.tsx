'use client';

import { useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Coins, CheckCircle, Clock, XCircle, FileImage, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

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
  proof_image_url?: string | null;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function usePackages() {
  return useQuery<CreditPackage[]>({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const { data } = await api.get('/api/credits/packages?all=true');
      return data;
    },
  });
}

function usePurchases() {
  return useQuery<CreditPurchase[]>({
    queryKey: ['credit-purchases'],
    queryFn: async () => {
      const { data } = await api.get('/api/credits/admin/purchases');
      return data;
    },
  });
}

// ── Package Modal ─────────────────────────────────────────────────────────────

function PackageModal({ pkg, onClose }: { pkg?: CreditPackage; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    credits: pkg?.credits ?? 100,
    bonusCredits: pkg?.bonusCredits ?? 0,
    price: pkg?.price ?? 100,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (pkg) {
        await api.patch(`/api/credits/packages/${pkg.id}`, form);
      } else {
        await api.post('/api/credits/packages', form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-packages'] });
      toast.success(pkg ? 'Paquete actualizado' : 'Paquete creado');
      onClose();
    },
    onError: () => toast.error('Error al guardar'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {pkg ? 'Editar paquete' : 'Nuevo paquete'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Pack Básico"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Créditos</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Créditos bonus</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                value={form.bonusCredits}
                onChange={(e) => setForm((f) => ({ ...f, bonusCredits: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Precio (Bs)</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
            />
          </div>
          {form.bonusCredits > 0 && (
            <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
              El rider recibe <strong>{form.credits + form.bonusCredits} créditos</strong> en total
              ({form.bonusCredits} de bonus)
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={() => save.mutate()} className="flex-1">
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Proof Modal ───────────────────────────────────────────────────────────────

function ProofModal({
  purchase,
  onConfirm,
  onClose,
  confirming,
}: {
  purchase: CreditPurchase;
  onConfirm: () => void;
  onClose: () => void;
  confirming: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Comprobante de pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
          <p><span className="font-medium text-gray-800">Rider:</span> {purchase.first_name} {purchase.last_name}</p>
          <p><span className="font-medium text-gray-800">Paquete:</span> {purchase.package_name}</p>
          <p><span className="font-medium text-gray-800">Monto:</span> {formatCurrency(Number(purchase.amount_paid))}</p>
          <p><span className="font-medium text-gray-800">Créditos:</span> {purchase.credits_granted}</p>
          <p><span className="font-medium text-gray-800">Ref:</span> <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">{purchase.payment_reference}</code></p>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={purchase.proof_image_url!}
          alt="Comprobante de pago"
          className="w-full rounded-xl border border-gray-200 object-contain max-h-80 bg-gray-50"
        />

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} loading={confirming} className="flex-1">
            <CheckCircle size={14} />
            Confirmar pago
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CreditPurchase['status'] }) {
  const map = {
    pending:   { label: 'Pendiente',  className: 'bg-yellow-100 text-yellow-700', icon: <Clock size={11} /> },
    confirmed: { label: 'Confirmado', className: 'bg-green-100 text-green-700',   icon: <CheckCircle size={11} /> },
    cancelled: { label: 'Cancelado',  className: 'bg-gray-100 text-gray-500',     icon: <XCircle size={11} /> },
    expired:   { label: 'Expirado',   className: 'bg-red-100 text-red-500',       icon: <XCircle size={11} /> },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CreditsPage() {
  const { data: packages, isLoading: loadingPkgs } = usePackages();
  const { data: purchases, isLoading: loadingPurchases } = usePurchases();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'new' | CreditPackage | null>(null);
  const [proofModal, setProofModal] = useState<CreditPurchase | null>(null);
  const [onlyPending, setOnlyPending] = useState(true);

  const confirm = useMutation({
    mutationFn: async (reference: string) => {
      await api.post(`/api/credits/admin/confirm/${reference}`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-purchases'] });
      setProofModal(null);
      toast.success('Pago confirmado — créditos acreditados');
    },
    onError: () => toast.error('Error al confirmar el pago'),
  });

  const toggleActive = useMutation({
    mutationFn: async (pkg: CreditPackage) => {
      await api.patch(`/api/credits/packages/${pkg.id}`, { isActive: !pkg.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit-packages'] }),
    onError: () => toast.error('Error al actualizar'),
  });

  // ── Columns: packages ──────────────────────────────────────────────────────

  const pkgColumns: Column<CreditPackage>[] = [
    {
      key: 'name',
      label: 'Paquete',
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Coins size={15} className="text-orange-500" />
          </div>
          <span className="font-medium text-gray-900 text-sm">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'credits',
      label: 'Créditos',
      render: (p) => (
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{p.credits}</span>
          {p.bonusCredits > 0 && (
            <span className="ml-1 text-green-600 text-xs">+{p.bonusCredits} bonus</span>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Precio',
      render: (p) => (
        <span className="text-sm font-medium text-gray-700">{formatCurrency(Number(p.price))}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleActive.mutate(p); }}
          className="flex items-center gap-1.5 text-sm"
        >
          {p.isActive ? (
            <>
              <ToggleRight size={20} className="text-green-500" />
              <Badge label="Activo" className="bg-green-100 text-green-700" />
            </>
          ) : (
            <>
              <ToggleLeft size={20} className="text-gray-400" />
              <Badge label="Inactivo" className="bg-gray-100 text-gray-500" />
            </>
          )}
        </button>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); setModal(p); }}
          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-all"
        >
          <Pencil size={14} />
        </button>
      ),
    },
  ];

  // ── Columns: purchases ─────────────────────────────────────────────────────

  const purchaseColumns: Column<CreditPurchase>[] = [
    {
      key: 'first_name',
      label: 'Rider',
      render: (p) => (
        <span className="text-sm font-medium text-gray-900">
          {p.first_name} {p.last_name}
        </span>
      ),
    },
    {
      key: 'package_name',
      label: 'Paquete',
      render: (p) => <span className="text-sm text-gray-700">{p.package_name}</span>,
    },
    {
      key: 'amount_paid',
      label: 'Monto',
      render: (p) => (
        <span className="text-sm font-medium text-gray-700">{formatCurrency(Number(p.amount_paid))}</span>
      ),
    },
    {
      key: 'credits_granted',
      label: 'Créditos',
      render: (p) => (
        <span className="text-sm font-semibold text-orange-600">{p.credits_granted}</span>
      ),
    },
    {
      key: 'payment_reference',
      label: 'Referencia',
      render: (p) => (
        <span className="text-xs font-mono text-gray-500">{p.payment_reference}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'created_at',
      label: 'Fecha',
      render: (p) => (
        <span className="text-xs text-gray-400">
          {new Date(p.created_at).toLocaleDateString('es-BO', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (p) => {
        if (p.status !== 'pending') return null;
        if (p.proof_image_url) {
          return (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setProofModal(p); }}
            >
              <FileImage size={13} />
              Ver comprobante
            </Button>
          );
        }
        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); confirm.mutate(p.payment_reference); }}
          >
            <CheckCircle size={13} />
            Confirmar
          </Button>
        );
      },
    },
  ];

  const filteredPurchases = onlyPending
    ? (purchases ?? []).filter((p) => p.status === 'pending')
    : (purchases ?? []);

  const pendingCount = (purchases ?? []).filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Créditos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Los riders compran créditos para aceptar pedidos. 1 crédito = 1 entrega.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModal('new')}>
          <Plus size={15} />
          Nuevo paquete
        </Button>
      </div>

      <Card title="Paquetes disponibles">
        <DataTable
          columns={pkgColumns}
          data={packages ?? []}
          keyField="id"
          loading={loadingPkgs}
          emptyMessage="No hay paquetes configurados"
        />
      </Card>

      <Card
        title={pendingCount > 0 ? `Compras de riders (${pendingCount} pendientes)` : 'Compras de riders'}
        action={
          <button
            onClick={() => setOnlyPending((v) => !v)}
            className="text-xs font-medium text-orange-600 hover:underline"
          >
            {onlyPending ? 'Ver todas' : 'Solo pendientes'}
          </button>
        }
      >
        <DataTable
          columns={purchaseColumns}
          data={filteredPurchases}
          keyField="id"
          loading={loadingPurchases}
          emptyMessage={onlyPending ? 'No hay compras pendientes' : 'No hay compras registradas'}
        />
      </Card>

      {modal && (
        <PackageModal
          pkg={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}

      {proofModal && (
        <ProofModal
          purchase={proofModal}
          onConfirm={() => confirm.mutate(proofModal.payment_reference)}
          onClose={() => setProofModal(null)}
          confirming={confirm.isPending}
        />
      )}
    </div>
  );
}
