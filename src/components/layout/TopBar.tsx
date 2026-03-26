'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Menu, UserCircle, HeadphonesIcon, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useFrontendAccess } from '@/hooks/useAuth';
import NotificationBell from './NotificationBell';
import { useSidebar } from './SidebarContext';
import toast from 'react-hot-toast';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/orders': 'Pedidos',
  '/dashboard/shops': 'Negocios',
  '/dashboard/users': 'Usuarios',
  '/dashboard/riders': 'Repartidores',
  '/dashboard/config': 'Configuración del Sistema',
  '/dashboard/payments': 'Pagos',
  '/dashboard/income': 'Ingresos',
  '/dashboard/bank-accounts': 'Cuentas Bancarias',
  '/dashboard/withdrawals': 'Retiros',
  '/dashboard/zones': 'Zonas de Entrega',
  '/dashboard/profile': 'Mi Perfil',
  '/dashboard/staff': 'Mi Personal',
  '/dashboard/my-shop': 'Mi Negocio',
  '/dashboard/my-shop/services': 'Servicios',
  '/dashboard/my-market': 'Mi Negocio',
  '/dashboard/my-market/products': 'Productos',
  '/dashboard/my-market/services': 'Ventas',
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
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
  const router = useRouter();
  const qc = useQueryClient();
  const { user, logout } = useAuthStore();
  const { toggle } = useSidebar();
  const { data: allowedRoutes = [] } = useFrontendAccess();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const title = getTitle(pathname);
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '??'
    : '??';

  function handleLogout() {
    logout();
    document.cookie = 'auth-token=; path=/; max-age=0';
    toast.success('Sesión cerrada');
    router.replace('/login');
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const canViewProfile = allowedRoutes.includes('/dashboard/profile');
  const canViewSupport = allowedRoutes.includes('/dashboard/support');

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

        {/* User dropdown */}
        <div className="relative ml-2 pl-3 border-l border-gray-200" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg hover:bg-gray-50 px-2 py-1.5 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </span>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              {canViewProfile && (
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <UserCircle size={16} className="text-gray-400" />
                  Mi Perfil
                </Link>
              )}
              {canViewSupport && (
                <Link
                  href="/dashboard/support"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <HeadphonesIcon size={16} className="text-gray-400" />
                  Soporte
                </Link>
              )}
              {(canViewProfile || canViewSupport) && (
                <div className="border-t border-gray-100 my-1" />
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={16} />
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
