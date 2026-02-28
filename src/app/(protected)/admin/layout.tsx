'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Home, Users, Car, FileText, Trophy, User as UserIcon, LogOut, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/users', label: 'Data User', icon: Users },
  { href: '/admin/vehicles', label: 'Kendaraan', icon: Car },
  { href: '/admin/bookings', label: 'Perjalanan', icon: FileText },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/admin/account', label: 'Akun', icon: UserIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || !token || user.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, user, token, router]);

  if (!isAuthenticated || !user || !token) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            {mobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo-si-lamin.png" alt="SI-LAMIN" className="h-8 w-8" />
            <span className="font-bold text-lg">SI-LAMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed md:sticky top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r border-slate-200 z-30 transition-transform duration-300 overflow-y-auto',
            'md:translate-x-0',
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-2">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 w-full">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
