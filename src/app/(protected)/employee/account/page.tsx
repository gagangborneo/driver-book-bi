'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AccountPage } from '@/components/account/account-page';

export default function EmployeeAccountPage() {
  const { user, token, setUser } = useAuthStore();
  if (!token || !user) return null;
  return <AccountPage token={token} user={user} onUserUpdate={setUser} />;
}
