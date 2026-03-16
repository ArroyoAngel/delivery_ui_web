'use client';

import { useAuthStore } from '@/store/useAuthStore';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import RestaurantDashboard from '@/components/dashboard/RestaurantDashboard';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <PageLoader />;

  const isSuperAdmin = user.roles.includes('superadmin');
  return isSuperAdmin ? <SuperAdminDashboard /> : <RestaurantDashboard />;
}
