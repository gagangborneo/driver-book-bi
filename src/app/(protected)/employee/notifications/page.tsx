'use client';

import { useAuthStore } from '@/lib/auth-store';
import { EmployeeNotifications } from '@/components/employee/employee-notifications';

export default function EmployeeNotificationsPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <EmployeeNotifications token={token} />;
}
