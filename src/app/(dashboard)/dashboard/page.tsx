'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import RestaurantDashboard from '@/components/dashboard/RestaurantDashboard';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { isSuperAdmin } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Wait for client mount so Zustand can rehydrate from localStorage.
  // Without this, server renders RestaurantDashboard (no localStorage) but
  // client renders SuperAdminDashboard → hydration mismatch.
  if (!mounted) return <PageLoader />;

  return isSuperAdmin() ? <SuperAdminDashboard /> : <RestaurantDashboard />;
}
