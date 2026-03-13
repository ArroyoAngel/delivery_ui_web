'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Resumen',  suffix: '',       icon: <LayoutDashboard size={14} /> },
  { label: 'Menú',     suffix: '/menu',  icon: <UtensilsCrossed size={14} /> },
  { label: 'Personal', suffix: '/staff', icon: <Users size={14} /> },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();

  return (
    <div className="space-y-0">
      {/* Sub-navigation tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map((tab) => {
          const href = `/dashboard/restaurants/${id}${tab.suffix}`;
          const isActive = tab.suffix === ''
            ? pathname === `/dashboard/restaurants/${id}`
            : pathname.startsWith(href);

          return (
            <Link
              key={tab.suffix}
              href={href}
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
