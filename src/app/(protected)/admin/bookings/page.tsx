'use client';

import { useAuthStore } from '@/lib/auth-store';
import { AdminBookings } from '@/components/admin/admin-bookings';

export default function AdminBookingsPage() {
  const { token } = useAuthStore();
  if (!token) return null;
  return <AdminBookings token={token} />;
}
