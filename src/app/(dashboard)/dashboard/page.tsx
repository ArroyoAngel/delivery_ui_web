'use client';

import { useAuthStore } from '@/store/useAuthStore';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import ShopDashboard from '@/components/dashboard/ShopDashboard';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <PageLoader />;

  const isSuperAdmin = user.roles.includes('superadmin');
  return isSuperAdmin ? <SuperAdminDashboard /> : <ShopDashboard />;
}
