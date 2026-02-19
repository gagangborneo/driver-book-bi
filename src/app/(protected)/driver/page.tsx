'use client';

import { useAuthStore } from '@/lib/auth-store';
import { DriverDashboard } from '@/components/driver/driver-dashboard';

export default function DriverDashboardPage() {
  const { user, token } = useAuthStore();
  if (!token || !user) return null;
  return <DriverDashboard token={token} user={user} />;
}
