'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, User, Truck, Settings, FileText } from 'lucide-react';
import { QuickActionsGrid } from '@/components/shared/quick-actions-grid';

interface AdminDashboardProps {
  token: string;
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    inProgressBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api('/stats', {}, token);
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const quickActions = [
    { icon: Users, label: 'Data User', color: 'bg-blue-500', action: () => router.push('/admin/users') },
    { icon: Car, label: 'Kendaraan', color: 'bg-green-500', action: () => router.push('/admin/vehicles') },
    { icon: FileText, label: 'Perjalanan', color: 'bg-orange-500', action: () => router.push('/admin/bookings') },
    { icon: Settings, label: 'Pengaturan', color: 'bg-purple-500', action: () => {} },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground text-sm">Monitoring sistem layanan manajemen intern</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total User</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Karyawan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Car className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                <p className="text-xs text-muted-foreground">Driver</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                <p className="text-xs text-muted-foreground">Kendaraan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Statistik Perjalanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
              <p className="text-sm text-muted-foreground">Menunggu</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats.inProgressBookings}</p>
              <p className="text-sm text-muted-foreground">Berlangsung</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.completedBookings}</p>
              <p className="text-sm text-muted-foreground">Selesai</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickActionsGrid actions={quickActions} />
    </div>
  );
}
