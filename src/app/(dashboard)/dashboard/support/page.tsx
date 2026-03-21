'use client';

import { useState } from 'react';
import { Card, StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
  useAllTickets,
  useMyTickets,
  useUpdateTicket,
  useCreateTicket,
  type SupportTicket,
} from '@/hooks/useSupport';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Clock3, Plus, SendHorizonal } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En revisión',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

// ── Modal respuesta SA ─────────────────────────────────────────────────────────

function ReplyModal({ ticket, onClose }: { ticket: SupportTicket; onClose: () => void }) {
  const [status, setStatus] = useState(ticket.status);
  const [notes, setNotes] = useState(ticket.adminNotes ?? '');
  const update = useUpdateTicket();

  async function handleSave() {
    try {
      await update.mutateAsync({ id: ticket.id, status, adminNotes: notes || undefined });
      toast.success('Ticket actualizado');
      onClose();
    } catch {
      toast.error('Error al actualizar');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Responder ticket</h3>

        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-gray-800">{ticket.subject}</p>
          <p className="text-gray-500">{ticket.email ?? ticket.accountId ?? '—'}</p>
          <p className="text-gray-700 mt-1">{ticket.message}</p>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Estado</label>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s as SupportTicket['status'])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  status === s
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Respuesta / Notas internas</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            rows={3}
            placeholder="Escribe una respuesta visible para el usuario..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} loading={update.isPending}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Modal nuevo ticket (admin de negocio) ──────────────────────────────────────

function NewTicketModal({ onClose }: { onClose: () => void }) {
  const create = useCreateTicket();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      toast.error('Asunto y mensaje son obligatorios');
      return;
    }
    try {
      await create.mutateAsync({ subject: subject.trim(), message: message.trim() });
      toast.success('Ticket enviado');
      onClose();
    } catch {
      toast.error('Error al enviar el ticket');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Nuevo ticket de soporte</h3>
        <p className="text-xs text-gray-500">Tu mensaje será revisado por el equipo de la plataforma.</p>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Asunto *</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Ej: Problema con mi saldo"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Mensaje *</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            rows={4}
            placeholder="Describe tu problema o consulta con el mayor detalle posible..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" onClick={handleSend} loading={create.isPending}>
            <SendHorizonal size={14} className="mr-1.5" />
            Enviar ticket
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Vista SA: todos los tickets ────────────────────────────────────────────────

function AdminSupportPage() {
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const { data: tickets = [], isLoading } = useAllTickets(200, filterStatus);
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  if (isLoading) return <PageLoader />;

  const open = tickets.filter((t) => t.status === 'open').length;
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="space-y-5">
      {selected && <ReplyModal ticket={selected} onClose={() => setSelected(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Tickets abiertos" value={open} icon={<MessageSquare size={20} />} />
        <StatCard label="En revisión" value={inProgress} icon={<Clock3 size={20} />} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus(undefined)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            !filterStatus ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-gray-400'
          }`}
        >
          Todos ({tickets.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? undefined : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterStatus === s
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <Card title="Tickets de soporte">
        <TicketsTable tickets={tickets} onSelect={setSelected} showUser />
      </Card>
    </div>
  );
}

// ── Vista Admin de negocio: sus propios tickets ────────────────────────────────

function ShopSupportPage() {
  const { data: tickets = [], isLoading } = useMyTickets();
  const [showNew, setShowNew] = useState(false);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {showNew && <NewTicketModal onClose={() => setShowNew(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Soporte</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Aquí puedes hacer consultas o reclamos a la plataforma.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={16} className="mr-1.5" />
          Nuevo ticket
        </Button>
      </div>

      <Card title="Mis tickets">
        <TicketsTable tickets={tickets} onSelect={null} showUser={false} />
      </Card>
    </div>
  );
}

// ── Tabla compartida ───────────────────────────────────────────────────────────

function TicketsTable({
  tickets,
  onSelect,
  showUser,
}: {
  tickets: SupportTicket[];
  onSelect: ((t: SupportTicket) => void) | null;
  showUser: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-3 pr-3">Estado</th>
            {showUser && <th className="py-3 pr-3">Usuario</th>}
            <th className="py-3 pr-3">Asunto</th>
            <th className="py-3 pr-3">Mensaje</th>
            <th className="py-3 pr-3">Respuesta</th>
            <th className="py-3 pr-3">Fecha</th>
            {onSelect && <th className="py-3">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && (
            <tr>
              <td colSpan={showUser ? 7 : 6} className="py-8 text-center text-gray-400">
                Sin tickets
              </td>
            </tr>
          )}
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-gray-50 text-gray-700 hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </td>
              {showUser && (
                <td className="py-3 pr-3 text-xs text-gray-500">{t.email ?? '—'}</td>
              )}
              <td className="py-3 pr-3 font-medium max-w-[160px] truncate">{t.subject}</td>
              <td className="py-3 pr-3 text-gray-500 max-w-[200px] truncate">{t.message}</td>
              <td className="py-3 pr-3 text-xs text-gray-400 max-w-[180px] truncate">
                {t.adminNotes ?? '—'}
              </td>
              <td className="py-3 pr-3 text-xs text-gray-400">
                {new Date(t.createdAt).toLocaleDateString('es-BO')}
              </td>
              {onSelect && (
                <td className="py-3">
                  <button
                    onClick={() => onSelect(t)}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    Responder
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function SupportPage() {
  const isSA = useAuthStore((s) => s.isSuperAdmin());
  return isSA ? <AdminSupportPage /> : <ShopSupportPage />;
}
