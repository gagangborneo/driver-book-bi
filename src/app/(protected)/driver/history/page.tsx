'use client';

import { useAuthStore } from '@/lib/auth-store';
import { DriverHistory } from '@/components/driver/driver-history';

export default function DriverHistoryPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <DriverHistory token={token} />;
}
