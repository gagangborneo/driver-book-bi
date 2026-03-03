'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/shared/loading';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, TrendingUp, Car, Users, MapPin, Gauge } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface AdminStatisticsProps {
  token: string;
}

interface Booking {
  id: string;
  employeeId: string;
  driverId: string | null;
  vehicleId: string | null;
  pickupLocation: string;
  destination: string;
  bookingDate: string;
  status: string;
  startOdometer: number | null;
  endOdometer: number | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
  };
  driver: {
    id: string;
    name: string;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ff9800',
  APPROVED: '#2196f3',
  DEPARTED: '#9c27b0',
  ARRIVED: '#4caf50',
  RETURNING: '#00bcd4',
  COMPLETED: '#8bc34a',
  REJECTED: '#f44336',
  CANCELLED: '#9e9e9e',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  DEPARTED: 'Berangkat',
  ARRIVED: 'Tiba',
  RETURNING: 'Kembali',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export function AdminStatistics({ token }: AdminStatisticsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '3months' | 'all'>('30days');

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      const data = await api('/bookings', {}, token);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings by time range
  const getFilteredBookings = () => {
    if (timeRange === 'all') {
      return bookings;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      default:
        return bookings;
    }

    return bookings.filter((booking) => new Date(booking.bookingDate) >= startDate);
  };

  const filteredBookings = getFilteredBookings();

  // Status distribution data
  const getStatusDistribution = () => {
    const statusCount: Record<string, number> = {};
    filteredBookings.forEach((booking) => {
      statusCount[booking.status] = (statusCount[booking.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#999',
    }));
  };

  // Daily booking trend
  const getDailyTrend = () => {
    const dailyCount: Record<string, number> = {};
    
    filteredBookings.forEach((booking) => {
      const date = format(new Date(booking.bookingDate), 'yyyy-MM-dd');
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    return Object.entries(dailyCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Last 30 days
      .map(([date, count]) => ({
        date: format(new Date(date), 'dd MMM', { locale: id }),
        jumlah: count,
      }));
  };

  // Top drivers by completed bookings
  const getTopDrivers = () => {
    const driverStats: Record<string, { name: string; count: number }> = {};
    
    filteredBookings
      .filter((b) => b.status === 'COMPLETED' && b.driver)
      .forEach((booking) => {
        if (booking.driver) {
          const driverId = booking.driver.id;
          if (!driverStats[driverId]) {
            driverStats[driverId] = { name: booking.driver.name, count: 0 };
          }
          driverStats[driverId].count += 1;
        }
      });

    return Object.values(driverStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((driver) => ({
        nama: driver.name,
        perjalanan: driver.count,
      }));
  };

  // Driver odometer accumulation
  const getDriverOdometer = () => {
    const driverOdometer: Record<string, { name: string; totalKm: number; count: number }> = {};
    
    filteredBookings
      .filter((b) => b.driver && b.startOdometer !== null && b.endOdometer !== null)
      .forEach((booking) => {
        if (booking.driver && booking.startOdometer !== null && booking.endOdometer !== null) {
          const driverId = booking.driver.id;
          const distance = booking.endOdometer - booking.startOdometer;
          
          if (!driverOdometer[driverId]) {
            driverOdometer[driverId] = { name: booking.driver.name, totalKm: 0, count: 0 };
          }
          driverOdometer[driverId].totalKm += distance;
          driverOdometer[driverId].count += 1;
        }
      });

    return Object.values(driverOdometer)
      .sort((a, b) => b.totalKm - a.totalKm)
      .slice(0, 10)
      .map((driver) => ({
        nama: driver.name,
        totalKm: driver.totalKm,
        rataRata: Math.round(driver.totalKm / driver.count),
      }));
  };

  // Top vehicles by usage
  const getTopVehicles = () => {
    const vehicleStats: Record<string, { name: string; count: number }> = {};
    
    filteredBookings
      .filter((b) => b.vehicle)
      .forEach((booking) => {
        if (booking.vehicle) {
          const vehicleId = booking.vehicle.id;
          const vehicleName = `${booking.vehicle.plateNumber} (${booking.vehicle.brand})`;
          if (!vehicleStats[vehicleId]) {
            vehicleStats[vehicleId] = { name: vehicleName, count: 0 };
          }
          vehicleStats[vehicleId].count += 1;
        }
      });

    return Object.values(vehicleStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((vehicle) => ({
        nama: vehicle.name,
        penggunaan: vehicle.count,
      }));
  };

  // Top destinations
  const getTopDestinations = () => {
    const destCount: Record<string, number> = {};
    
    filteredBookings.forEach((booking) => {
      const dest = booking.destination;
      destCount[dest] = (destCount[dest] || 0) + 1;
    });

    return Object.entries(destCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([destination, count]) => ({
        tujuan: destination,
        jumlah: count,
      }));
  };

  // Monthly booking trend
  const getMonthlyTrend = () => {
    const monthlyCount: Record<string, number> = {};
    
    filteredBookings.forEach((booking) => {
      const month = format(new Date(booking.bookingDate), 'MMM yyyy', { locale: id });
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });

    return Object.entries(monthlyCount)
      .sort(([a], [b]) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12) // Last 12 months
      .map(([month, count]) => ({
        bulan: month,
        jumlah: count,
      }));
  };

  const statusDistribution = getStatusDistribution();
  const dailyTrend = getDailyTrend();
  const topDrivers = getTopDrivers();
  const driverOdometer = getDriverOdometer();
  const topVehicles = getTopVehicles();
  const topDestinations = getTopDestinations();
  const monthlyTrend = getMonthlyTrend();

  // Calculate summary stats
  const totalBookings = filteredBookings.length;
  const completedBookings = filteredBookings.filter((b) => b.status === 'COMPLETED').length;
  const totalDistance = filteredBookings
    .filter((b) => b.startOdometer !== null && b.endOdometer !== null)
    .reduce((sum, b) => sum + ((b.endOdometer || 0) - (b.startOdometer || 0)), 0);
  const avgDistance = completedBookings > 0 ? Math.round(totalDistance / completedBookings) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Statistik Perjalanan</h2>
          <p className="text-muted-foreground text-sm">Analisis dan laporan perjalanan booking</p>
        </div>
        <Select value={timeRange} onValueChange={(value: typeof timeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">7 Hari Terakhir</SelectItem>
            <SelectItem value="30days">30 Hari Terakhir</SelectItem>
            <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
            <SelectItem value="all">Semua Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={6} height="h-64" />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Perjalanan</p>
                    <p className="text-2xl font-bold">{totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selesai</p>
                    <p className="text-2xl font-bold">{completedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Gauge className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jarak</p>
                    <p className="text-2xl font-bold">{totalDistance.toLocaleString('id-ID')} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata Jarak</p>
                    <p className="text-2xl font-bold">{avgDistance} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Status Perjalanan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tren Perjalanan Bulanan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="jumlah" stroke="#8b5cf6" strokeWidth={2} name="Jumlah" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Perjalanan Harian (30 Hari Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="jumlah" stroke="#3b82f6" strokeWidth={2} name="Perjalanan" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Drivers */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Driver (Perjalanan Selesai)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topDrivers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nama" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="perjalanan" fill="#10b981" name="Perjalanan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Driver Odometer */}
            <Card>
              <CardHeader>
                <CardTitle>Akumulasi Jarak Driver (km)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={driverOdometer} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nama" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalKm" fill="#f59e0b" name="Total Km" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Vehicles */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Kendaraan Paling Sering Digunakan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topVehicles} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nama" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="penggunaan" fill="#6366f1" name="Penggunaan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Destinations */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Tujuan Paling Sering</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topDestinations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="tujuan" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="jumlah" fill="#ec4899" name="Jumlah" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
