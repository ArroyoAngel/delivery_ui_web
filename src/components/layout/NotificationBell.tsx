'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Unread count — poll cada 30 s
  const { data: countData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get<{ count: number }>('/api/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30_000,
  });

  // List — solo carga cuando el dropdown está abierto
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/api/notifications?limit=20').then((r) => r.data),
    enabled: open,
    staleTime: 0,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = countData?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notificaciones"
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all relative"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notificaciones</span>
            {unread > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-orange-500 hover:text-orange-700 font-medium"
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    n.isRead ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    )}
                    <div className={!n.isRead ? '' : 'pl-4'}>
                      <p className="text-sm font-medium text-gray-800 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
