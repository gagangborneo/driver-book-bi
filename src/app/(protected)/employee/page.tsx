'use client';

import { useAuthStore } from '@/lib/auth-store';
import { EmployeeDashboard } from '@/components/employee/employee-dashboard';

export default function EmployeeDashboardPage() {
  const { user, token } = useAuthStore();
  if (!token || !user) return null;
  return <EmployeeDashboard token={token} user={user} />;
}
