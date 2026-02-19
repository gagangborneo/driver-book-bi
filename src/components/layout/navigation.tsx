'use client';

import { useState } from 'react';
import { type User as UserType, type UserRole } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Car, Users, LogOut, Home, History, User as UserIcon,  
  FileText, Trophy, Building 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  role: UserRole;
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  user: UserType;
}

export function Navigation({ role, currentView, setCurrentView, onLogout, user }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    if (role === 'EMPLOYEE') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'history', label: 'Riwayat', icon: History },
        { id: 'account', label: 'Akun', icon: UserIcon },
      ];
    } else if (role === 'DRIVER') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'history', label: 'Riwayat', icon: History },
        { id: 'account', label: 'Akun', icon: UserIcon },
      ];
    } else {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'users', label: 'Data User', icon: Users },
        { id: 'vehicles', label: 'Kendaraan', icon: Car },
        { id: 'bookings', label: 'Perjalanan', icon: FileText },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        { id: 'account', label: 'Akun', icon: UserIcon },
      ];
    }
  };

  const navItems = getNavItems();

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
                key={item.id}
                variant={currentView === item.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView(item.id)}
                className="gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t z-50 flex items-center justify-around px-2 safe-area-inset-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors',
              currentView === item.id 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg text-muted-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Keluar</span>
        </button>
      </nav>
    </>
  );
}
