'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChefHat, RefreshCw, Clock, ArrowRight, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { useOrders, useMarkPreparing, useMarkReady, useMarkLocalDelivered } from '@/hooks/useOrders';
import { useOrdersSocket } from '@/hooks/useOrdersSocket';
import type { Order } from '@/models';

// ─── helpers ──────────────────────────────────────────────────────────────────

function elapsedMin(dateStr: string, now: number): number {
  return Math.floor((now - new Date(dateStr).getTime()) / 60000);
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}min`;
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}min`;
}

// Color tiers: green → amber → orange → red
function timerStyles(mins: number): { text: string; bg: string; label: string } {
  if (mins < 10) return { text: 'text-green-400',  bg: 'bg-green-950/60',  label: 'A tiempo' };
  if (mins < 20) return { text: 'text-amber-400',  bg: 'bg-amber-950/60',  label: '¡Apurate!' };
  if (mins < 30) return { text: 'text-orange-400', bg: 'bg-orange-950/60', label: 'Tarde' };
  return             { text: 'text-red-400',    bg: 'bg-red-950/60',    label: '¡Demorado!' };
}

// ─── KitchenCard ──────────────────────────────────────────────────────────────

interface KitchenCardProps {
  order: Order;
  advanceLabel: string;
  advanceColor: string;   // tailwind bg class for the swipe hint overlay
  onAdvance: () => Promise<void>;
}

function KitchenCard({ order, advanceLabel, advanceColor, onAdvance }: KitchenCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, dx: 0 });
  const [phase, setPhase] = useState<'idle' | 'flying' | 'gone'>('idle');
  const [swipeHint, setSwipeHint] = useState(0); // 0–1 opacity for advance overlay
  const [, setConfirming] = useState(false);

  // pointer-based drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== 'idle') return;
    drag.current = { active: true, startX: e.clientX, dx: 0 };
    cardRef.current?.setPointerCapture(e.pointerId);
  }, [phase]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active || phase !== 'idle') return;
    const dx = e.clientX - drag.current.startX;
    drag.current.dx = dx;
    const el = cardRef.current;
    if (!el) return;
    const clamped = Math.max(dx, -30); // allow small left movement
    const rot = (clamped / 300) * 12;
    el.style.transform = `translateX(${clamped}px) rotate(${rot}deg)`;
    el.style.transition = 'none';
    // show advance overlay only when dragging right
    setSwipeHint(dx > 0 ? Math.min(dx / 100, 1) : 0);
  }, [phase]);

  const onPointerUp = useCallback(async () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const dx = drag.current.dx;
    const el = cardRef.current;
    if (!el) return;

    if (dx > 80) {
      // commit: fly card out to the right
      setPhase('flying');
      el.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      el.style.transform = `translateX(120%) rotate(20deg)`;
      el.style.opacity = '0';
      setConfirming(true);
      await new Promise((r) => setTimeout(r, 280));
      try { await onAdvance(); } catch { /* ignore — query will show error elsewhere */ }
      setPhase('gone');
    } else {
      // spring back
      el.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'translateX(0) rotate(0deg)';
      setSwipeHint(0);
    }
  }, [onAdvance]);

  // live timer — updates every 30s
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (phase === 'gone') return null;

  const items = order.items ?? [];
  const mins = elapsedMin(order.createdAt, now);
  const timer = timerStyles(mins);

  // deliveryAddress: "Consumo en local · Mesa 3" | "Recojo en tienda"
  const isLocal = order.deliveryAddress?.startsWith('Consumo en local') ?? false;
  const areaLabel = isLocal
    ? (order.deliveryAddress.replace('Consumo en local · ', '').replace('Consumo en local', 'Local'))
    : 'Para llevar';

  // strip the backend metadata from notes — user notes come before " | Canal:"
  const userNotes = order.notes
    ? (order.notes.split(' | Canal:')[0].trim() || null)
    : null;

  return (
    <div
      ref={cardRef}
      className="relative bg-gray-900 border border-gray-700 rounded-2xl p-3 cursor-grab active:cursor-grabbing select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ willChange: 'transform', userSelect: 'none', touchAction: 'pan-y' }}
    >
      {/* swipe overlay */}
      {swipeHint > 0 && (
        <div
          className={`absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none ${advanceColor}`}
          style={{ opacity: swipeHint * 0.85 }}
        >
          <span className="text-white text-sm font-bold flex items-center gap-2">
            <ArrowRight size={18} /> {advanceLabel}
          </span>
        </div>
      )}

      {/* ── timer ── */}
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-3 ${timer.bg}`}>
        <Clock size={14} className={timer.text} />
        <div className="flex flex-col">
          <span className={`text-xl font-black tabular-nums leading-none ${timer.text}`}>{mins}min</span>
          <span className={`text-[10px] font-medium opacity-70 ${timer.text}`}>{timer.label}</span>
        </div>
      </div>

      {/* ── items ── */}
      <ul className="space-y-2 mb-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="text-2xl font-black text-white leading-none">{item.quantity}×</span>
            <span className="text-sm font-semibold text-gray-100 leading-snug">{item.item_name}</span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-gray-500 italic">Sin detalle de ítems</li>
        )}
      </ul>

      {/* ── notes (solo las del usuario, sin metadata del backend) ── */}
      {userNotes && (
        <p className="text-xs text-amber-300 bg-amber-950/50 border border-amber-800 rounded-lg px-2 py-1 mb-3">
          📝 {userNotes}
        </p>
      )}

      {/* ── service / area ── */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 ${
        isLocal
          ? 'bg-orange-500/15 border border-orange-500/40'
          : 'bg-sky-900/30 border border-sky-700/50'
      }`}>
        {isLocal
          ? <UtensilsCrossed size={13} className="text-orange-400 shrink-0" />
          : <ShoppingBag size={13} className="text-sky-400 shrink-0" />
        }
        <span className={`text-sm font-bold ${isLocal ? 'text-orange-300' : 'text-sky-300'}`}>
          {areaLabel}
        </span>
      </div>

    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KitchenColumn({
  title,
  accentClass,
  countClass,
  emptyMsg,
  orders,
  advanceLabel,
  advanceColor,
  onAdvance,
}: {
  title: string;
  accentClass: string;
  countClass: string;
  emptyMsg: string;
  orders: Order[];
  advanceLabel: string | ((order: Order) => string);
  advanceColor: string | ((order: Order) => string);
  onAdvance: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-col min-w-0 h-full">
      {/* column header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${accentClass}`}>
        <h2 className="text-sm font-bold text-white flex-1">{title}</h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countClass}`}>
          {orders.length}
        </span>
      </div>

      {/* cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <ChefHat size={36} className="text-gray-600 mb-3 opacity-40" />
            <p className="text-sm text-gray-500">{emptyMsg}</p>
          </div>
        ) : (
          orders.map((order) => (
            <KitchenCard
              key={order.id}
              order={order}
              advanceLabel={typeof advanceLabel === 'function' ? advanceLabel(order) : advanceLabel}
              advanceColor={typeof advanceColor === 'function' ? advanceColor(order) : advanceColor}
              onAdvance={() => onAdvance(order.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── KitchenView ──────────────────────────────────────────────────────────────

interface KitchenViewProps {
  onClose: () => void;
}

export default function KitchenView({ onClose }: KitchenViewProps) {
  useOrdersSocket();
  const { data: orders = [], refetch, isFetching, dataUpdatedAt } = useOrders({ enabled: true });
  const markPreparing = useMarkPreparing();
  const markReady = useMarkReady();
  const markLocalDelivered = useMarkLocalDelivered();

  // Pedidos del portal web (consumo en local o recojo en tienda) van directo a entregado
  const isLocalOrder = (o: Order) =>
    (o.deliveryAddress?.startsWith('Consumo en local') || o.deliveryAddress === 'Recojo en tienda') ?? false;

  // auto-refresh every 15s
  useEffect(() => {
    const id = setInterval(() => { refetch(); }, 15000);
    return () => clearInterval(id);
  }, [refetch]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const byOldest = (a: Order, b: Order) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const confirmados = orders.filter((o) => o.status === 'confirmado').sort(byOldest);
  const preparando = orders.filter((o) => o.status === 'preparando').sort(byOldest);


  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
      {/* ── header ── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <ChefHat size={20} className="text-orange-400" />
        <h1 className="text-sm font-bold text-white flex-1">Vista Cocina</h1>

        <span className="text-[11px] text-gray-500">
          Actualizado {timeAgo(new Date(dataUpdatedAt).toISOString())} atrás
        </span>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
          title="Actualizar"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Cerrar (Esc)"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── columns ── */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        <KitchenColumn
          title="Confirmados"
          accentClass="bg-blue-900/60 border-blue-800"
          countClass="bg-blue-700 text-white"
          emptyMsg="Sin pedidos confirmados"
          orders={confirmados}
          advanceLabel="Preparando"
          advanceColor="bg-purple-500"
          onAdvance={(id) => markPreparing.mutateAsync(id)}
        />
        <div className="border-l border-gray-800">
          <KitchenColumn
            title="Preparando"
            accentClass="bg-purple-900/60 border-purple-800"
            countClass="bg-purple-700 text-white"
            emptyMsg="Sin pedidos en preparación"
            orders={preparando}
            advanceLabel={(o) => isLocalOrder(o) ? 'Entregar' : 'Listo'}
            advanceColor={(o) => isLocalOrder(o) ? 'bg-emerald-500' : 'bg-green-500'}
            onAdvance={(id) => {
              const order = preparando.find((o) => o.id === id);
              return isLocalOrder(order!)
                ? markLocalDelivered.mutateAsync(id)
                : markReady.mutateAsync(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}
