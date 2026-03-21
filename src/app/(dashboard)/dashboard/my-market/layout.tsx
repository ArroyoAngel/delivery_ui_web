'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBasket, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Resumen',    href: '/dashboard/my-market',          icon: <LayoutDashboard size={14} /> },
  { label: 'Productos',  href: '/dashboard/my-market/products', icon: <ShoppingBasket size={14} /> },
  { label: 'Servicios',  href: '/dashboard/my-market/services', icon: <Store size={14} /> },
];

export default function MyMarketLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-0">
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map((tab) => {
          const isActive = tab.href === '/dashboard/my-market'
            ? pathname === '/dashboard/my-market'
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
