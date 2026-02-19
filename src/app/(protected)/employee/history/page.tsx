'use client';

import { useAuthStore } from '@/lib/auth-store';
import { EmployeeHistory } from '@/components/employee/employee-history';

export default function EmployeeHistoryPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <EmployeeHistory token={token} />;
}
