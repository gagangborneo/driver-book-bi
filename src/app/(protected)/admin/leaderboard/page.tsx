'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminLeaderboard } from '@/components/admin/admin-leaderboard';

export default function AdminLeaderboardPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <AdminLeaderboard token={token} />;
}
