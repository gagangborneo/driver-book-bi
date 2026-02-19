'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminUsers } from '@/components/admin/admin-users';

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <AdminUsers token={token} />;
}
