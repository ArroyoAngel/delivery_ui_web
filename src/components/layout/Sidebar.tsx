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
  ReceiptText,
  ShieldCheck,
  Wallet,
  Landmark,
  HandCoins,
  MapPin,
  UserCircle,
  HeadphonesIcon,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useFrontendAccess } from '@/hooks/useAuth';
import { useMyShop } from '@/hooks/useShops';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Función personalizada para detectar el estado activo */
  matchFn?: (pathname: string) => boolean;
  /** Mostrar solo cuando el negocio es market, solo restaurante, o siempre (undefined) */
  showWhen?: 'market' | 'restaurant';
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'ORDERS_LABEL',
    href: '/dashboard/orders',
    icon: <ShoppingBag size={18} />,
  },
  {
    label: 'Mi Negocio',
    href: '/dashboard/my-shop',
    icon: <Store size={18} />,
    matchFn: (p) => p.startsWith('/dashboard/my-shop') && !p.startsWith('/dashboard/my-shop/services'),
    showWhen: 'restaurant',
  },
  {
    label: 'Servicios',
    href: '/dashboard/my-shop/services',
    icon: <ReceiptText size={18} />,
    matchFn: (p) => p.startsWith('/dashboard/my-shop/services'),
    showWhen: 'restaurant',
  },
  {
    label: 'Mi Negocio',
    href: '/dashboard/my-market',
    icon: <Store size={18} />,
    matchFn: (p) => p.startsWith('/dashboard/my-market') && !p.startsWith('/dashboard/my-market/services'),
    showWhen: 'market',
  },
  {
    label: 'Ventas',
    href: '/dashboard/my-market/services',
    icon: <ReceiptText size={18} />,
    matchFn: (p) => p.startsWith('/dashboard/my-market/services'),
    showWhen: 'market',
  },
  {
    label: 'Mi Personal',
    href: '/dashboard/staff',
    icon: <Users size={18} />,
    matchFn: (p) => p === '/dashboard/staff',
  },
  {
    label: 'Negocios',
    href: '/dashboard/shops',
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
  {
    label: 'Pagos',
    href: '/dashboard/payments',
    icon: <Wallet size={18} />,
  },
  {
    label: 'Ingresos',
    href: '/dashboard/income',
    icon: <Wallet size={18} />,
  },
  {
    label: 'Cuentas Bancarias',
    href: '/dashboard/bank-accounts',
    icon: <Landmark size={18} />,
  },
  {
    label: 'Retiros',
    href: '/dashboard/withdrawals',
    icon: <HandCoins size={18} />,
  },
  {
    label: 'Zonas',
    href: '/dashboard/zones',
    icon: <MapPin size={18} />,
  },
  {
    label: 'Cupones',
    href: '/dashboard/coupons',
    icon: <Tag size={18} />,
  },
  {
    label: 'Soporte',
    href: '/dashboard/support',
    icon: <HeadphonesIcon size={18} />,
  },
  {
    label: 'Mi Perfil',
    href: '/dashboard/profile',
    icon: <UserCircle size={18} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isOpen, close } = useSidebar();
  const { data: allowedRoutes = [], isLoading: loadingAccess } = useFrontendAccess();
  const { data: myStore } = useMyShop();
  const isMarket = myStore?.businessType === 'supermarket' || myStore?.businessType === 'minimarket';

  function handleLogout() {
    logout();
    document.cookie = 'auth-token=; path=/; max-age=0';
    toast.success('Sesión cerrada');
    router.replace('/login');
  }
  const visibleItems = loadingAccess
    ? []
    : NAV_ITEMS.filter((item) => {
      if (!allowedRoutes.includes(item.href)) return false;
      if (item.showWhen && !myStore) return false;          // sin negocio → ocultar
      if (item.showWhen === 'market' && !isMarket) return false;
      if (item.showWhen === 'restaurant' && isMarket) return false;
      return true;
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
      {/* Overlay para móvil/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 hidden max-[1024px]:block"
          onClick={close}
        />
      )}
      <aside className={cn('sidebar flex flex-col', isOpen && 'open')}>
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

          const label = item.label === 'ORDERS_LABEL'
            ? (isMarket ? 'Ventas' : 'Pedidos')
            : item.label;

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
              <span className="flex-1">{label}</span>
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
