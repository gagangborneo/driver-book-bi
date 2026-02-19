'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Navigation } from '@/components/layout/navigation';

const roleRouteMap: Record<string, string> = {
  ADMIN: '/admin',
  DRIVER: '/driver',
  EMPLOYEE: '/employee',
};

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || !user || !token) {
      router.replace('/login');
      return;
    }

    // Ensure user is on the correct role-based route
    const expectedPrefix = roleRouteMap[user.role];
    if (expectedPrefix && !pathname.startsWith(expectedPrefix)) {
      router.replace(expectedPrefix);
    }
  }, [isAuthenticated, user, token, router, pathname]);

  if (!isAuthenticated || !user || !token) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation
        role={user.role}
        currentPath={pathname}
        onLogout={handleLogout}
        user={user}
      />
      <main className="flex-1 pt-14 md:pt-16 pb-20 md:pb-6 px-4 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
