'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminDashboardPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <AdminDashboard token={token} />;
}
