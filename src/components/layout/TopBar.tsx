'use client';

import { usePathname } from 'next/navigation';
import { RefreshCw, Menu } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import NotificationBell from './NotificationBell';
import { useSidebar } from './SidebarContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Pedidos',
  '/dashboard/restaurants': 'Restaurantes',
  '/dashboard/users': 'Usuarios',
  '/dashboard/riders': 'Repartidores',
  '/dashboard/config': 'Configuración del Sistema',
};

function getTitle(pathname: string): string {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Check parents
  const parts = pathname.split('/').filter(Boolean);
  while (parts.length > 0) {
    const key = '/' + parts.join('/');
    if (PAGE_TITLES[key]) return PAGE_TITLES[key];
    parts.pop();
  }
  return 'Admin';
}

export default function TopBar() {
  const pathname = usePathname();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const title = getTitle(pathname);
  const { toggle } = useSidebar();

  return (
    <header className="topbar flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="max-[1024px]:flex hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
          title="Menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => qc.invalidateQueries()}
          title="Refrescar datos"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
        >
          <RefreshCw size={17} />
        </button>

        <NotificationBell />

        <div className="ml-2 flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
            {user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '??' : '??'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </span>
        </div>
      </div>
    </header>
  );
}
