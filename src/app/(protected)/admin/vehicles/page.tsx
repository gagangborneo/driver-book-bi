'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminVehicles } from '@/components/admin/admin-vehicles';

export default function AdminVehiclesPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <AdminVehicles token={token} />;
}
