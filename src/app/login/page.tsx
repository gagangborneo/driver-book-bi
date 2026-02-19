'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { LoginPage } from '@/components/auth/login-page';

const roleRouteMap: Record<string, string> = {
  ADMIN: '/admin',
  DRIVER: '/driver',
  EMPLOYEE: '/employee',
};

export default function LoginRoute() {
  const { user, isAuthenticated, login } = useAuthStore();
  const router = useRouter();

  // If already authenticated, redirect to role dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(roleRouteMap[user.role] || '/');
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = (loginUser: Parameters<typeof login>[0], token: string) => {
    login(loginUser, token);
    router.replace(roleRouteMap[loginUser.role] || '/');
  };

  if (isAuthenticated && user) {
    return null;
  }

  return <LoginPage onLogin={handleLogin} />;
}
