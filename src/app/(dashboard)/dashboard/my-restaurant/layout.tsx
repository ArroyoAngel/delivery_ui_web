'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Resumen',  href: '/dashboard/my-restaurant',       icon: <LayoutDashboard size={14} /> },
  { label: 'Menú',     href: '/dashboard/my-restaurant/menu',  icon: <UtensilsCrossed size={14} /> },
  { label: 'Personal', href: '/dashboard/my-restaurant/staff', icon: <Users size={14} /> },
];

export default function MyRestaurantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-0">
      {/* Sub-navigation tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map((tab) => {
          const isActive = tab.href === '/dashboard/my-restaurant'
            ? pathname === '/dashboard/my-restaurant'
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
