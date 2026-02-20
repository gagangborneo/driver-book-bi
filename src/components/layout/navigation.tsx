'use client';

import Link from 'next/link';
import { type User as UserType, type UserRole } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Car, Users, LogOut, Home, History, User as UserIcon,  
  FileText, Trophy, Building 
} from 'lucide-react';

// LogOut is kept for desktop nav usage
import { cn } from '@/lib/utils';

interface NavigationProps {
  role: UserRole;
  currentPath: string;
  onLogout: () => void;
  user: UserType;
}

export function Navigation({ role, currentPath, onLogout, user }: NavigationProps) {
  const rolePrefix = role === 'ADMIN' ? '/admin' : role === 'DRIVER' ? '/driver' : '/employee';

  const getNavItems = () => {
    if (role === 'EMPLOYEE') {
      return [
        { href: '/employee', label: 'Dashboard', icon: Home },
        { href: '/employee/history', label: 'Riwayat', icon: History },
        { href: '/employee/account', label: 'Akun', icon: UserIcon },
      ];
    } else if (role === 'DRIVER') {
      return [
        { href: '/driver', label: 'Dashboard', icon: Home },
        { href: '/driver/history', label: 'Riwayat', icon: History },
        { href: '/driver/account', label: 'Akun', icon: UserIcon },
      ];
    } else {
      return [
        { href: '/admin', label: 'Dashboard', icon: Home },
        { href: '/admin/users', label: 'Data User', icon: Users },
        { href: '/admin/vehicles', label: 'Kendaraan', icon: Car },
        { href: '/admin/bookings', label: 'Perjalanan', icon: FileText },
        { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
        { href: '/admin/account', label: 'Akun', icon: UserIcon },
      ];
    }
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === rolePrefix) {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-slate-700" />
            <span className="font-bold text-lg">Bank Indonesia</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-slate-700" />
          <span className="font-bold">Bank Indonesia</span>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-50 flex items-center justify-around px-2 safe-area-inset-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] rounded-xl transition-all',
              isActive(item.href) 
                ? 'text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-md shadow-blue-500/30 scale-105' 
                : 'text-slate-400 hover:text-slate-600 active:scale-95'
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive(item.href) && 'drop-shadow-sm')} />
            <span className={cn('text-[10px] font-semibold', isActive(item.href) ? 'text-white' : '')}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

