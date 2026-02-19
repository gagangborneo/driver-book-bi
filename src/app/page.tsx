'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { LoginPage } from '@/components/auth/login-page';
import { Navigation } from '@/components/layout/navigation';
import { EmployeeDashboard } from '@/components/employee/employee-dashboard';
import { EmployeeHistory } from '@/components/employee/employee-history';
import { DriverDashboard } from '@/components/driver/driver-dashboard';
import { DriverHistory } from '@/components/driver/driver-history';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminUsers } from '@/components/admin/admin-users';
import { AdminVehicles } from '@/components/admin/admin-vehicles';
import { AdminBookings } from '@/components/admin/admin-bookings';
import { AdminLeaderboard } from '@/components/admin/admin-leaderboard';
import { AccountPage } from '@/components/account/account-page';

// Main App Component
export default function DriverBookingApp() {
  const { user, token, isAuthenticated, login, logout, setUser } = useAuthStore();
  const [currentView, setCurrentView] = useState('dashboard');

  // Handle logout
  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
  };

  // Show login page if not authenticated
  if (!isAuthenticated || !user || !token) {
    return <LoginPage onLogin={login} />;
  }

  // Render content based on current view and user role
  const renderContent = () => {
    if (user.role === 'EMPLOYEE') {
      switch (currentView) {
        case 'dashboard':
          return <EmployeeDashboard token={token} user={user} onViewChange={setCurrentView} />;
        case 'history':
          return <EmployeeHistory token={token} />;
        case 'account':
          return <AccountPage token={token} user={user} onUserUpdate={setUser} />;
        default:
          return <EmployeeDashboard token={token} user={user} onViewChange={setCurrentView} />;
      }
    }

    if (user.role === 'DRIVER') {
      switch (currentView) {
        case 'dashboard':
          return <DriverDashboard token={token} user={user} onViewChange={setCurrentView} />;
        case 'history':
          return <DriverHistory token={token} />;
        case 'account':
          return <AccountPage token={token} user={user} onUserUpdate={setUser} />;
        default:
          return <DriverDashboard token={token} user={user} onViewChange={setCurrentView} />;
      }
    }

    if (user.role === 'ADMIN') {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard token={token} onViewChange={setCurrentView} />;
        case 'users':
          return <AdminUsers token={token} />;
        case 'vehicles':
          return <AdminVehicles token={token} />;
        case 'bookings':
          return <AdminBookings token={token} />;
        case 'leaderboard':
          return <AdminLeaderboard token={token} />;
        case 'account':
          return <AccountPage token={token} user={user} onUserUpdate={setUser} />;
        default:
          return <AdminDashboard token={token} onViewChange={setCurrentView} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation
        role={user.role}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
        user={user}
      />
      
      <main className="flex-1 pt-14 md:pt-16 pb-20 md:pb-6 px-4 max-w-4xl mx-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
}
