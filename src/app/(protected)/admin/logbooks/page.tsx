'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminLogbooks } from '@/components/admin/admin-logbooks';

export default function AdminLogbooksPage() {
  const { token } = useAuthStore();
  if (!token) {
    return null;
  }
  return <AdminLogbooks token={token} />;
}
