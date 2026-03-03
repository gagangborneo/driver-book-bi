'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminStatistics } from '@/components/admin/admin-statistics';

export default function AdminStatisticsPage() {
  const { token } = useAuthStore();
  if (!token) {
    return null;
  }
  return <AdminStatistics token={token} />;
}
