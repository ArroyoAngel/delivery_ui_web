'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  Bike,
  Settings,
  LogOut,
  ChevronRight,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useFrontendAccess } from '@/hooks/useAuth';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Función personalizada para detectar el estado activo */
  matchFn?: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Pedidos',
    href: '/dashboard/orders',
    icon: <ShoppingBag size={18} />,
  },
  {
    label: 'Mi Restaurante',
    href: '/dashboard/my-restaurant',
    icon: <UtensilsCrossed size={18} />,
    matchFn: (p) => p.startsWith('/dashboard/my-restaurant'),
  },
  {
    label: 'Mi Personal',
    href: '/dashboard/staff',
    icon: <Users size={18} />,
    matchFn: (p) => p === '/dashboard/staff',
  },
  {
    label: 'Restaurantes',
    href: '/dashboard/restaurants',
    icon: <Store size={18} />,
  },
  {
    label: 'Usuarios',
    href: '/dashboard/users',
    icon: <Users size={18} />,
  },
  {
    label: 'Repartidores',
    href: '/dashboard/riders',
    icon: <Bike size={18} />,
  },
  {
    label: 'Configuración',
    href: '/dashboard/config',
    icon: <Settings size={18} />,
  },
  {
    label: 'Roles',
    href: '/dashboard/roles',
    icon: <ShieldCheck size={18} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isOpen, close } = useSidebar();
  const { data: allowedRoutes = [], isLoading: loadingAccess } = useFrontendAccess();

  function handleLogout() {
    logout();
    document.cookie = 'auth-token=; path=/; max-age=0';
    toast.success('Sesión cerrada');
    router.replace('/login');
  }
  const visibleItems = loadingAccess
    ? []
    : NAV_ITEMS.filter((item) => {
      return allowedRoutes.includes(item.href);
    });

  const roleLabel = user?.roles.includes('superadmin')
    ? 'Super Admin'
    : user?.roles.includes('admin')
    ? 'Admin'
    : user?.roles.includes('rider')
    ? 'Repartidor'
    : 'Cliente';

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={close}
        />
      )}
    <aside className={cn(
      'sidebar flex flex-col',
      'fixed lg:relative z-30',
      'transition-transform duration-300',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    )}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          Y
        </div>
        <div>
          <p className="text-white font-semibold text-sm">YaYa Eats</p>
          <p className="text-gray-400 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = item.matchFn
            ? item.matchFn(pathname)
            : item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
              )}
              style={isActive ? { backgroundColor: '#f97316' } : {}}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '??' : '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </p>
            <p className="text-gray-500 text-xs truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
    </>
  );
}
