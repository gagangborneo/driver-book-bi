'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const roleRouteMap: Record<string, string> = {
  ADMIN: '/admin',
  DRIVER: '/driver',
  EMPLOYEE: '/employee',
};

export default function RootPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleRouteMap[user.role] || '/login');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return null;
}
