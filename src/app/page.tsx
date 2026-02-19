'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, type User, type UserRole } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, Users, UserCog, LogOut, Home, History, User, Menu, X, 
  Bell, MapPin, Calendar, Clock, Check, XCircle, Play, Flag,
  Truck, Wrench, Droplets, Fuel, Plus, Settings, Database,
  FileText, ChevronRight, Phone, Mail, Building, AlertCircle,
  Navigation as NavigationIcon, ArrowRight, RotateCcw, Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

// API helper for Bank Indonesia Driver Booking
const api = async (endpoint: string, options: RequestInit = {}, token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

// Login Page Component
function LoginPage({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      onLogin(data.user, data.token);
      toast({
        title: 'Login Berhasil',
        description: `Selamat datang, ${data.user.name}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@bi.go.id', role: 'Admin', icon: UserCog, color: 'text-red-600' },
    { email: 'budi.santoso@bi.go.id', role: 'Karyawan', icon: Users, color: 'text-green-600' },
    { email: 'driver.joko@bi.go.id', role: 'Driver', icon: Car, color: 'text-blue-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Building className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bank Indonesia</h1>
          <p className="text-slate-400">Driver Booking System</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Masuk ke Akun</CardTitle>
            <CardDescription className="text-center">
              Masukkan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@bi.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="border-0 shadow-lg bg-slate-800/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword('password123');
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
              >
                <account.icon className={cn('h-5 w-5', account.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{account.email}</p>
                  <p className="text-xs text-slate-400">{account.role}</p>
                </div>
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                  password123
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Navigation Component
function Navigation({ 
  role, 
  currentView, 
  setCurrentView, 
  onLogout,
  user 
}: { 
  role: UserRole; 
  currentView: string; 
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  user: User;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const getNavItems = () => {
    if (role === 'EMPLOYEE') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'history', label: 'Riwayat', icon: History },
        { id: 'account', label: 'Akun', icon: User },
      ];
    } else if (role === 'DRIVER') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'history', label: 'Riwayat', icon: History },
        { id: 'account', label: 'Akun', icon: User },
      ];
    } else {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'users', label: 'Data User', icon: Users },
        { id: 'vehicles', label: 'Kendaraan', icon: Car },
        { id: 'bookings', label: 'Perjalanan', icon: FileText },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        { id: 'account', label: 'Akun', icon: User },
      ];
    }
  };

  const navItems = getNavItems();

  // Desktop Navigation
  const DesktopNav = () => (
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
  );

  // Mobile Navigation
  const MobileNav = () => (
    <>
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

  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  );
}

// Employee Dashboard
function EmployeeDashboard({ 
  token, 
  user,
  onViewChange 
}: { 
  token: string; 
  user: User;
  onViewChange: (view: string) => void;
}) {
  const [drivers, setDrivers] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, completedBookings: 0, inProgressBookings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Record<string, unknown> | null>(null);
  const [bookingForm, setBookingForm] = useState({
    pickupLocation: '',
    destination: '',
    bookingDate: '',
    bookingTime: '',
    notes: '',
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driversData, statsData] = await Promise.all([
          api('/drivers', {}, token),
          api('/stats', {}, token),
        ]);
        setDrivers(driversData.drivers);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleBooking = async () => {
    if (!selectedDriver) return;
    
    setIsSubmitting(true);
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          driverId: selectedDriver.id,
          ...bookingForm,
        }),
      }, token);

      toast({
        title: 'Pemesanan Berhasil',
        description: 'Pemesanan driver telah dikirim. Menunggu konfirmasi driver.',
      });

      setIsBookingModalOpen(false);
      setSelectedDriver(null);
      setBookingForm({
        pickupLocation: '',
        destination: '',
        bookingDate: '',
        bookingTime: '',
        notes: '',
      });
      
      // Refresh stats
      const statsData = await api('/stats', {}, token);
      setStats(statsData);
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-500">Tersedia</Badge>;
      case 'IN_TRIP':
        return <Badge className="bg-yellow-500">Dalam Perjalanan</Badge>;
      case 'HAS_PENDING':
        return <Badge className="bg-orange-500">Ada Pesanan</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-red-500">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const quickActions = [
    { icon: Car, label: 'Pesan Driver', color: 'bg-blue-500', action: () => {} },
    { icon: History, label: 'Riwayat', color: 'bg-green-500', action: () => onViewChange('history') },
    { icon: Bell, label: 'Notifikasi', color: 'bg-orange-500', action: () => {} },
    { icon: User, label: 'Profil', color: 'bg-purple-500', action: () => onViewChange('account') },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-semibold">Selamat Datang, {user.name}!</h2>
        <p className="text-slate-300 text-sm mt-1">Pesan driver untuk perjalanan Anda</p>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalBookings}</p>
            <p className="text-xs text-slate-300">Total Pesanan</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingBookings}</p>
            <p className="text-xs text-slate-300">Menunggu</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{stats.completedBookings}</p>
            <p className="text-xs text-slate-300">Selesai</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold mb-4">Menu Cepat</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={cn('p-3 rounded-xl text-white', action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Available Drivers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Driver Tersedia</h3>
          <Button variant="ghost" size="sm" className="text-sm text-primary">
            Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {drivers.map((driver) => (
                <Card 
                  key={driver.id as string}
                  className={cn(
                    'cursor-pointer transition-all',
                    driver.availabilityStatus === 'AVAILABLE' 
                      ? 'hover:shadow-md hover:border-green-300' 
                      : 'opacity-60'
                  )}
                  onClick={() => {
                    if (driver.availabilityStatus === 'AVAILABLE') {
                      setSelectedDriver(driver);
                      setIsBookingModalOpen(true);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {(driver.name as string).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{driver.name as string}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {driver.assignedVehicle ? (
                            <>
                              {(driver.assignedVehicle as Record<string, unknown>).brand as string} - {(driver.assignedVehicle as Record<string, unknown>).plateNumber as string}
                            </>
                          ) : (
                            'Belum ada kendaraan'
                          )}
                        </p>
                      </div>
                      {getStatusBadge(driver.availabilityStatus as string)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pesan Driver</DialogTitle>
            <DialogDescription>
              Isi detail perjalanan Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDriver && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {(selectedDriver.name as string).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedDriver.name as string}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDriver.assignedVehicle ? (
                      <>
                        {(selectedDriver.assignedVehicle as Record<string, unknown>).brand as string} - {(selectedDriver.assignedVehicle as Record<string, unknown>).plateNumber as string}
                      </>
                    ) : 'Driver'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Lokasi Penjemputan</Label>
              <Input
                placeholder="Contoh: Kantor BI Jakarta"
                value={bookingForm.pickupLocation}
                onChange={(e) => setBookingForm({ ...bookingForm, pickupLocation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tujuan</Label>
              <Input
                placeholder="Contoh: Bandara Soekarno-Hatta"
                value={bookingForm.destination}
                onChange={(e) => setBookingForm({ ...bookingForm, destination: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Jam</Label>
                <Input
                  type="time"
                  value={bookingForm.bookingTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                placeholder="Tambahkan catatan..."
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleBooking} 
              disabled={isSubmitting || !bookingForm.pickupLocation || !bookingForm.destination || !bookingForm.bookingDate || !bookingForm.bookingTime}
            >
              {isSubmitting ? 'Memproses...' : 'Pesan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Employee History
function EmployeeHistory({ token }: { token: string }) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      const data = await api('/bookings', {}, token);
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await api(`/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'CANCELLED' }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Pesanan berhasil dibatalkan',
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Menunggu Konfirmasi</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case 'DEPARTED':
        return <Badge className="bg-cyan-500">Berangkat</Badge>;
      case 'ARRIVED':
        return <Badge className="bg-orange-500">Tiba di Tujuan</Badge>;
      case 'RETURNING':
        return <Badge className="bg-purple-500">Dalam Perjalanan Pulang</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat Perjalanan</h2>
        <p className="text-muted-foreground text-sm">Daftar perjalanan Anda</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada riwayat perjalanan</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-3 pr-4">
            {bookings.map((booking) => (
              <Card key={booking.id as string} className={cn(
                (booking.status as string) === 'CANCELLED' && 'opacity-60'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {booking.driver ? (booking.driver as Record<string, unknown>).name as string : 'Menunggu Driver'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.vehicle ? `${(booking.vehicle as Record<string, unknown>).brand as string} - ${(booking.vehicle as Record<string, unknown>).plateNumber as string}` : '-'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status as string)}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{booking.pickupLocation as string}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flag className="h-4 w-4 text-red-500" />
                      <span>{booking.destination as string}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.bookingDate as string)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.bookingTime as string}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Button for PENDING bookings */}
                  {(booking.status as string) === 'PENDING' && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancelBooking(booking.id as string)}
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Membatalkan...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Batalkan Pesanan
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Map visualization component
function MapVisualization({ 
  pickup, 
  destination, 
  currentStatus 
}: { 
  pickup: { lat: number; lng: number; name: string } | null;
  destination: { lat: number; lng: number; name: string } | null;
  currentStatus: string;
}) {
  // Calculate relative positions for visual map
  const getRelativePosition = (lat: number, lng: number) => {
    // Normalize coordinates around Jakarta area
    const minLat = -6.3, maxLat = -6.0;
    const minLng = 106.6, maxLng = 107.0;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const pickupPos = pickup ? getRelativePosition(pickup.lat, pickup.lng) : null;
  const destPos = destination ? getRelativePosition(destination.lat, destination.lng) : null;

  // Calculate current position based on status
  const getCurrentPos = () => {
    if (!pickupPos || !destPos) return null;
    
    switch (currentStatus) {
      case 'DEPARTED':
        return { x: pickupPos.x + (destPos.x - pickupPos.x) * 0.25, y: pickupPos.y + (destPos.y - pickupPos.y) * 0.25 };
      case 'ARRIVED':
        return destPos;
      case 'RETURNING':
        return { x: destPos.x + (pickupPos.x - destPos.x) * 0.5, y: destPos.y + (pickupPos.y - destPos.y) * 0.5 };
      default:
        return pickupPos;
    }
  };

  const currentPos = getCurrentPos();

  return (
    <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div key={`h-${i}`} className="absolute w-full h-px bg-slate-300" style={{ top: `${i * 25}%` }} />
        ))}
        {[...Array(5)].map((_, i) => (
          <div key={`v-${i}`} className="absolute h-full w-px bg-slate-300" style={{ left: `${i * 25}%` }} />
        ))}
      </div>

      {/* Route line */}
      {pickupPos && destPos && (
        <svg className="absolute inset-0 w-full h-full">
          <line
            x1={`${pickupPos.x}%`}
            y1={`${pickupPos.y}%`}
            x2={`${destPos.x}%`}
            y2={`${destPos.y}%`}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}

      {/* Pickup marker */}
      {pickupPos && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pickupPos.x}%`, top: `${pickupPos.y}%` }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
              {pickup?.name || 'Titik Jemput'}
            </div>
          </div>
        </div>
      )}

      {/* Destination marker */}
      {destPos && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${destPos.x}%`, top: `${destPos.y}%` }}
        >
          <div className="relative">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <Flag className="h-4 w-4 text-white" />
            </div>
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
              {destination?.name || 'Tujuan'}
            </div>
          </div>
        </div>
      )}

      {/* Current position marker */}
      {currentPos && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
        >
          <div className="relative animate-pulse">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
              currentStatus === 'ARRIVED' ? 'bg-red-500' : 
              currentStatus === 'RETURNING' ? 'bg-purple-500' : 'bg-blue-500'
            )}>
              <Car className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-inherit rotate-45" />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-3 text-xs bg-white/80 px-2 py-1 rounded">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Jemput</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>Tujuan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Posisi</span>
        </div>
      </div>
    </div>
  );
}

// Driver Dashboard
function DriverDashboard({ 
  token, 
  user,
  onViewChange 
}: { 
  token: string; 
  user: User;
  onViewChange: (view: string) => void;
}) {
  const [pendingBookings, setPendingBookings] = useState<Array<Record<string, unknown>>>([]);
  const [activeBooking, setActiveBooking] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState({ pendingBookings: 0, completedBookings: 0, todayBookings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogBookModal, setShowLogBookModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Array<Record<string, unknown>>>([]);
  const [logBookForm, setLogBookForm] = useState({
    vehicleId: '',
    type: 'WASHING',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    odometer: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [bookingsData, statsData, vehiclesData] = await Promise.all([
        api('/bookings', {}, token),
        api('/stats', {}, token),
        api('/vehicles', {}, token),
      ]);
      
      const pending = bookingsData.bookings.filter((b: Record<string, unknown>) => b.status === 'PENDING');
      const active = bookingsData.bookings.find((b: Record<string, unknown>) => 
        ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING'].includes(b.status as string)
      );
      
      setPendingBookings(pending);
      setActiveBooking(active || null);
      setStats(statsData);
      setVehicles(vehiclesData.vehicles);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject' | 'depart' | 'arrive' | 'returning' | 'complete') => {
    // For approve and reject, open modals instead
    if (action === 'approve') {
      const booking = pendingBookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        // Pre-select the first available vehicle
        const availableVehicles = vehicles.filter((v: Record<string, unknown>) => v.status === 'AVAILABLE');
        if (availableVehicles.length > 0) {
          setSelectedVehicleId(availableVehicles[0].id as string);
        }
        setShowAcceptModal(true);
      }
      return;
    }
    
    if (action === 'reject') {
      const booking = pendingBookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setRejectionReason('');
        setShowRejectModal(true);
      }
      return;
    }

    // Other actions proceed normally
    try {
      const statusMap: Record<string, string> = {
        approve: 'APPROVED',
        reject: 'CANCELLED',
        depart: 'DEPARTED',
        arrive: 'ARRIVED',
        returning: 'RETURNING',
        complete: 'COMPLETED',
      };

      const body: Record<string, unknown> = { status: statusMap[action] };

      await api(`/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }, token);

      const actionMessages: Record<string, string> = {
        approve: 'disetujui',
        reject: 'ditolak',
        depart: 'dimulai - sedang menuju lokasi penjemputan',
        arrive: 'tiba di tujuan',
        returning: 'sedang kembali',
        complete: 'selesai',
      };

      toast({
        title: 'Berhasil',
        description: `Pesanan telah ${actionMessages[action]}`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptBooking = async () => {
    if (!selectedBooking || !selectedVehicleId) return;
    
    setIsSubmitting(true);
    try {
      await api(`/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'APPROVED',
          vehicleId: selectedVehicleId,
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Pesanan telah disetujui dan kendaraan telah ditentukan',
      });

      setShowAcceptModal(false);
      setSelectedBooking(null);
      setSelectedVehicleId('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!selectedBooking || !rejectionReason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await api(`/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'CANCELLED',
          rejectionReason: rejectionReason.trim(),
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Pesanan telah ditolak',
      });

      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogBookSubmit = async () => {
    try {
      await api('/logbooks', {
        method: 'POST',
        body: JSON.stringify(logBookForm),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'LogBook telah dicatat',
      });

      setShowLogBookModal(false);
      setLogBookForm({
        vehicleId: '',
        type: 'WASHING',
        description: '',
        date: new Date().toISOString().split('T')[0],
        cost: '',
        odometer: '',
      });
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Siap Berangkat', color: 'bg-blue-500', step: 1 };
      case 'DEPARTED':
        return { label: 'Menuju Penjemputan', color: 'bg-cyan-500', step: 2 };
      case 'ARRIVED':
        return { label: 'Tiba di Tujuan', color: 'bg-orange-500', step: 3 };
      case 'RETURNING':
        return { label: 'Kembali', color: 'bg-purple-500', step: 4 };
      case 'COMPLETED':
        return { label: 'Selesai', color: 'bg-green-500', step: 5 };
      default:
        return { label: status, color: 'bg-slate-500', step: 0 };
    }
  };

  const quickActions = [
    { icon: Wrench, label: 'LogBook', color: 'bg-blue-500', action: () => setShowLogBookModal(true) },
    { icon: History, label: 'Riwayat', color: 'bg-green-500', action: () => onViewChange('history') },
    { icon: Truck, label: 'Kendaraan', color: 'bg-orange-500', action: () => {} },
    { icon: User, label: 'Profil', color: 'bg-purple-500', action: () => onViewChange('account') },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-semibold">Halo, {user.name}!</h2>
        <p className="text-slate-300 text-sm mt-1">Ada pesanan yang menunggu Anda</p>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pendingBookings}</p>
            <p className="text-xs text-slate-300">Menunggu</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.todayBookings}</p>
            <p className="text-xs text-slate-300">Hari Ini</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{stats.completedBookings}</p>
            <p className="text-xs text-slate-300">Selesai</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold mb-4">Menu Cepat</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={cn('p-3 rounded-xl text-white', action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Trip with Map */}
      {activeBooking && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <NavigationIcon className="h-5 w-5 text-orange-500" />
            Perjalanan Aktif
          </h3>
          <Card className="border-orange-200">
            <CardContent className="p-4 space-y-4">
              {/* Map Visualization */}
              <MapVisualization 
                pickup={activeBooking.pickupCoords as { lat: number; lng: number; name: string } | null}
                destination={activeBooking.destinationCoords as { lat: number; lng: number; name: string } | null}
                currentStatus={activeBooking.status as string}
              />

              {/* Progress Steps */}
              <div className="flex items-center justify-between px-2">
                {['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING', 'COMPLETED'].map((s, i) => {
                  const statusInfo = getStatusInfo(s);
                  const currentStep = getStatusInfo(activeBooking.status as string).step;
                  const isActive = statusInfo.step <= currentStep;
                  const isCurrent = s === activeBooking.status;
                  
                  return (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        isActive ? statusInfo.color : 'bg-slate-200 text-slate-400',
                        isCurrent && 'ring-2 ring-offset-2 ring-orange-400'
                      )}>
                        {i + 1}
                      </div>
                      <span className={cn('text-[9px] text-center', isActive ? 'text-slate-700' : 'text-slate-400')}>
                        {s === 'APPROVED' ? 'Siap' : s === 'DEPARTED' ? 'Berangkat' : s === 'ARRIVED' ? 'Tiba' : s === 'RETURNING' ? 'Kembali' : 'Selesai'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Employee Info */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {(activeBooking.employee as Record<string, unknown>).name?.toString().charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{(activeBooking.employee as Record<string, unknown>).name as string}</p>
                    <p className="text-sm text-muted-foreground">{(activeBooking.employee as Record<string, unknown>).phone as string}</p>
                  </div>
                </div>
                <Badge className={getStatusInfo(activeBooking.status as string).color}>
                  {getStatusInfo(activeBooking.status as string).label}
                </Badge>
              </div>

              {/* Location Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Titik Penjemputan</p>
                    <p className="text-green-600">{activeBooking.pickupLocation as string}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                  <Flag className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Tujuan</p>
                    <p className="text-red-600">{activeBooking.destination as string}</p>
                  </div>
                </div>
                {activeBooking.vehicle && (
                  <div className="flex items-center gap-2 text-muted-foreground p-2 bg-slate-50 rounded-lg">
                    <Car className="h-4 w-4" />
                    <span>{(activeBooking.vehicle as Record<string, unknown>).brand as string} - {(activeBooking.vehicle as Record<string, unknown>).plateNumber as string}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons based on status */}
              <div className="space-y-2">
                {activeBooking.status === 'APPROVED' && (
                  <Button 
                    className="w-full bg-cyan-600 hover:bg-cyan-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'depart')}
                  >
                    <NavigationIcon className="h-4 w-4 mr-2" />
                    Mulai Keberangkatan
                  </Button>
                )}
                
                {activeBooking.status === 'DEPARTED' && (
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'arrive')}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Konfirmasi Tiba di Tujuan
                  </Button>
                )}
                
                {activeBooking.status === 'ARRIVED' && (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'returning')}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Mulai Kembali
                  </Button>
                )}
                
                {activeBooking.status === 'RETURNING' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'complete')}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Selesaikan Perjalanan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Bookings */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-yellow-500" />
          Pesanan Masuk
          {pendingBookings.length > 0 && (
            <Badge className="bg-yellow-500 ml-2">{pendingBookings.length}</Badge>
          )}
        </h3>

        {pendingBookings.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Tidak ada pesanan baru</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBookings.map((booking) => (
              <Card key={booking.id as string} className="border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(booking.employee as Record<string, unknown>).name?.toString().charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{(booking.employee as Record<string, unknown>).name as string}</p>
                        <p className="text-sm text-muted-foreground">{(booking.employee as Record<string, unknown>).phone as string}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{booking.pickupLocation as string}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-red-500" />
                      <span>{booking.destination as string}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(booking.bookingDate as string).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.bookingTime as string}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleBookingAction(booking.id as string, 'approve')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Terima
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleBookingAction(booking.id as string, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Tolak
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* LogBook Modal */}
      <Dialog open={showLogBookModal} onOpenChange={setShowLogBookModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat LogBook</DialogTitle>
            <DialogDescription>
              Catat aktivitas kendaraan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kendaraan</Label>
              <Select 
                value={logBookForm.vehicleId} 
                onValueChange={(value) => setLogBookForm({ ...logBookForm, vehicleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kendaraan" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id as string} value={v.id as string}>
                      {v.brand as string} - {v.plateNumber as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipe Aktivitas</Label>
              <Select 
                value={logBookForm.type} 
                onValueChange={(value) => setLogBookForm({ ...logBookForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WASHING">Cuci Kendaraan</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="FUEL">Isi Bensin</SelectItem>
                  <SelectItem value="OTHER">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi aktivitas..."
                value={logBookForm.description}
                onChange={(e) => setLogBookForm({ ...logBookForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={logBookForm.date}
                  onChange={(e) => setLogBookForm({ ...logBookForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Biaya (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={logBookForm.cost}
                  onChange={(e) => setLogBookForm({ ...logBookForm, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Odometer (km)</Label>
              <Input
                type="number"
                placeholder="0"
                value={logBookForm.odometer}
                onChange={(e) => setLogBookForm({ ...logBookForm, odometer: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogBookModal(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleLogBookSubmit}
              disabled={!logBookForm.vehicleId || !logBookForm.description}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Booking Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terima Pesanan</DialogTitle>
            <DialogDescription>
              Pilih kendaraan yang akan digunakan untuk perjalanan ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>{selectedBooking.pickupLocation as string}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-500" />
                  <span>{selectedBooking.destination as string}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Pilih Kendaraan *</Label>
              <Select 
                value={selectedVehicleId} 
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kendaraan" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles
                    .filter((v: Record<string, unknown>) => v.status === 'AVAILABLE')
                    .map((v: Record<string, unknown>) => (
                      <SelectItem key={v.id as string} value={v.id as string}>
                        {v.brand as string} {v.model as string} - {v.plateNumber as string}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              {vehicles.filter((v: Record<string, unknown>) => v.status === 'AVAILABLE').length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada kendaraan tersedia</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleAcceptBooking}
              disabled={!selectedVehicleId || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Terima'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Booking Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pesanan</DialogTitle>
            <DialogDescription>
              Berikan alasan mengapa Anda menolak pesanan ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>{selectedBooking.pickupLocation as string}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-500" />
                  <span>{selectedBooking.destination as string}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Alasan Penolakan *</Label>
              <Textarea
                placeholder="Contoh: Jadwal bentrok, kendaraan sedang dalam perbaikan, dll."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectBooking}
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Driver History
function DriverHistory({ token }: { token: string }) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [logBooks, setLogBooks] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'logbook'>('trips');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsData, logBooksData] = await Promise.all([
          api('/bookings', {}, token),
          api('/logbooks', {}, token),
        ]);
        setBookings(bookingsData.bookings);
        setLogBooks(logBooksData.logBooks);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Menunggu</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-orange-500">Berlangsung</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLogBookIcon = (type: string) => {
    switch (type) {
      case 'WASHING':
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case 'SERVICE':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'FUEL':
        return <Fuel className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat</h2>
        <p className="text-muted-foreground text-sm">Catatan perjalanan dan aktivitas</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('trips')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'trips' ? 'bg-white shadow-sm' : 'text-muted-foreground'
          )}
        >
          Perjalanan
        </button>
        <button
          onClick={() => setActiveTab('logbook')}
          className={cn(
            'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
            activeTab === 'logbook' ? 'bg-white shadow-sm' : 'text-muted-foreground'
          )}
        >
          LogBook
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'trips' ? (
        bookings.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada riwayat perjalanan</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3 pr-4">
              {bookings.map((booking) => (
                <Card key={booking.id as string}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{(booking.employee as Record<string, unknown>).name as string}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.vehicle ? `${(booking.vehicle as Record<string, unknown>).brand as string}` : '-'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status as string)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span>{booking.pickupLocation as string}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flag className="h-4 w-4 text-red-500" />
                        <span>{booking.destination as string}</span>
                      </div>
                    </div>

                    {(booking.startOdometer || booking.endOdometer) && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        Odometer: {booking.startOdometer || '-'} km → {booking.endOdometer || '-'} km
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )
      ) : (
        logBooks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada catatan logbook</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3 pr-4">
              {logBooks.map((log) => (
                <Card key={log.id as string}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getLogBookIcon(log.type as string)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{log.description as string}</p>
                        <p className="text-sm text-muted-foreground">
                          {(log.vehicle as Record<string, unknown>).plateNumber as string} • {formatDate(log.date as string)}
                        </p>
                        {log.cost && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Rp {(log.cost as number).toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )
      )}
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ token, onViewChange }: { token: string; onViewChange: (view: string) => void }) {
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
    { icon: Users, label: 'Data User', color: 'bg-blue-500', action: () => onViewChange('users') },
    { icon: Car, label: 'Kendaraan', color: 'bg-green-500', action: () => onViewChange('vehicles') },
    { icon: FileText, label: 'Perjalanan', color: 'bg-orange-500', action: () => onViewChange('bookings') },
    { icon: Settings, label: 'Pengaturan', color: 'bg-purple-500', action: () => {} },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground text-sm">Monitoring sistem driver booking</p>
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

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold mb-4">Menu Cepat</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={cn('p-3 rounded-xl text-white', action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple Status Badge for Admin
function StatusBadgeSimple({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Menunggu</Badge>;
    case 'APPROVED':
      return <Badge className="bg-blue-500 text-xs">Disetujui</Badge>;
    case 'DEPARTED':
      return <Badge className="bg-cyan-500 text-xs">Berangkat</Badge>;
    case 'ARRIVED':
      return <Badge className="bg-orange-500 text-xs">Tiba</Badge>;
    case 'RETURNING':
      return <Badge className="bg-purple-500 text-xs">Kembali</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-500 text-xs">Selesai</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive" className="text-xs">Dibatalkan</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

// Admin Users Management
function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    inProgressBookings: 0,
  });
  const [userBookings, setUserBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
  });
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
    isActive: true,
  });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [token, filter]);

  const fetchUsers = async () => {
    try {
      const url = filter !== 'all' ? `/users?role=${filter}` : '/users';
      const data = await api(url, {}, token);
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUserDetail = async (user: Record<string, unknown>) => {
    setSelectedUser(user);
    setShowUserDetail(true);
    setIsLoadingDetail(true);
    
    try {
      // Fetch bookings based on user role
      const userRole = user.role as string;
      const endpoint = userRole === 'EMPLOYEE' 
        ? `/bookings?userId=${user.id}&userRole=employee`
        : `/bookings?userId=${user.id}&userRole=driver`;
      
      const data = await api(endpoint, {}, token);
      const bookings = data.bookings || [];
      
      // Calculate statistics
      const stats = {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'PENDING').length,
        approvedBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'APPROVED').length,
        completedBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'COMPLETED').length,
        cancelledBookings: bookings.filter((b: Record<string, unknown>) => b.status === 'CANCELLED').length,
        inProgressBookings: bookings.filter((b: Record<string, unknown>) => 
          ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING'].includes(b.status as string)
        ).length,
      };
      
      setUserStats(stats);
      setUserBookings(bookings);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memuat data user',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'User berhasil ditambahkan',
      });

      setShowAddModal(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'EMPLOYEE' });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      }, token);

      toast({
        title: 'Berhasil',
        description: `User telah ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!editUser.id) return;
    
    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role,
        isActive: editUser.isActive,
      };
      
      // Only include password if it's provided
      if (editUser.password && editUser.password.trim() !== '') {
        updateData.password = editUser.password;
      }
      
      await api(`/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'User berhasil diperbarui',
      });

      setShowEditModal(false);
      setEditUser({ id: '', name: '', email: '', phone: '', password: '', role: 'EMPLOYEE', isActive: true });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    setIsSubmitting(true);
    try {
      await api(`/users/${deleteUserId}`, {
        method: 'DELETE',
      }, token);

      toast({
        title: 'Berhasil',
        description: 'User berhasil dihapus',
      });

      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: Record<string, unknown>) => {
    setEditUser({
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      phone: (user.phone as string) || '',
      password: '',
      role: user.role as string,
      isActive: user.isActive as boolean,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userId: string) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-500">Admin</Badge>;
      case 'DRIVER':
        return <Badge className="bg-blue-500">Driver</Badge>;
      case 'EMPLOYEE':
        return <Badge className="bg-green-500">Karyawan</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Data User</h2>
          <p className="text-muted-foreground text-sm">Kelola pengguna sistem</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'EMPLOYEE', 'DRIVER', 'ADMIN'].map((role) => (
          <Button
            key={role}
            variant={filter === role ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(role)}
          >
            {role === 'all' ? 'Semua' : role === 'EMPLOYEE' ? 'Karyawan' : role === 'DRIVER' ? 'Driver' : 'Admin'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-3 pr-4">
            {users.map((user) => (
              <Card 
                key={user.id as string}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                onClick={() => handleViewUserDetail(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(user.name as string).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name as string}</p>
                        <p className="text-sm text-muted-foreground">{user.email as string}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {getRoleBadge(user.role as string)}
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(user);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(user.id as string, user.isActive as boolean);
                      }}
                    >
                      {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(user.id as string);
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
            <DialogDescription>
              Tambahkan pengguna baru
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={!newUser.name || !newUser.email || !newUser.password}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
            <DialogDescription>
              Statistik dan riwayat perjalanan
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {(selectedUser.name as string).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedUser.name as string}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email as string}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedUser.role as string)}
                    <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                      {selectedUser.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>
                {selectedUser.phone && (
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Telepon</p>
                    <p className="font-medium">{selectedUser.phone as string}</p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Statistik Aktivitas
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{userStats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Total Perjalanan</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-xl">
                    <p className="text-2xl font-bold text-yellow-600">{userStats.pendingBookings}</p>
                    <p className="text-xs text-muted-foreground">Menunggu</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{userStats.completedBookings}</p>
                    <p className="text-xs text-muted-foreground">Selesai</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">{userStats.inProgressBookings}</p>
                    <p className="text-xs text-muted-foreground">Berlangsung</p>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 rounded-xl">
                    <p className="text-2xl font-bold text-cyan-600">{userStats.approvedBookings}</p>
                    <p className="text-xs text-muted-foreground">Disetujui</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-600">{userStats.cancelledBookings}</p>
                    <p className="text-xs text-muted-foreground">Dibatalkan</p>
                  </div>
                </div>
              </div>

              {/* Trip History */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat Perjalanan
                </h4>
                {userBookings.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <Car className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Belum ada riwayat perjalanan</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {userBookings.map((booking) => (
                        <Card key={booking.id as string} className="border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {booking.status === 'COMPLETED' ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : booking.status === 'CANCELLED' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className="font-medium text-sm">
                                  {booking.destination as string}
                                </span>
                              </div>
                              <StatusBadgeSimple status={booking.status as string} />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{booking.pickupLocation as string}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(booking.bookingDate as string).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{booking.bookingTime as string}</span>
                                </div>
                              </div>
                              {booking.driver && (
                                <div className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  <span>{(booking.driver as Record<string, unknown>).name as string}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetail(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editUser.email}
                disabled
                className="bg-slate-100"
              />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input
                value={editUser.phone}
                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                value={editUser.password}
                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
              <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah password</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Karyawan</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editUser.isActive}
                onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive">Akun Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button onClick={handleEditUser} disabled={!editUser.name || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin Vehicles Management
function AdminVehicles({ token }: { token: string }) {
  const [vehicles, setVehicles] = useState<Array<Record<string, unknown>>>([]);
  const [drivers, setDrivers] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
  });
  const [editVehicle, setEditVehicle] = useState({
    id: '',
    plateNumber: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    status: 'AVAILABLE',
    assignedToId: '__none__',
  });
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, [token]);

  const fetchDrivers = async () => {
    try {
      const data = await api('/users?role=DRIVER', {}, token);
      setDrivers(data.users || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await api('/vehicles', {}, token);
      setVehicles(data.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    setIsSubmitting(true);
    try {
      await api('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          ...newVehicle,
          year: parseInt(newVehicle.year),
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Kendaraan berhasil ditambahkan',
      });

      setShowAddModal(false);
      setNewVehicle({ plateNumber: '', brand: '', model: '', year: '', color: '' });
      fetchVehicles();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async () => {
    if (!editVehicle.id) return;
    
    setIsSubmitting(true);
    try {
      await api(`/vehicles/${editVehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          plateNumber: editVehicle.plateNumber,
          brand: editVehicle.brand,
          model: editVehicle.model,
          year: parseInt(editVehicle.year),
          color: editVehicle.color,
          status: editVehicle.status,
          assignedToId: editVehicle.assignedToId === '__none__' ? null : editVehicle.assignedToId || null,
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Kendaraan berhasil diperbarui',
      });

      setShowEditModal(false);
      setEditVehicle({ id: '', plateNumber: '', brand: '', model: '', year: '', color: '', status: 'AVAILABLE', assignedToId: '__none__' });
      fetchVehicles();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleId) return;
    
    setIsSubmitting(true);
    try {
      await api(`/vehicles/${deleteVehicleId}`, {
        method: 'DELETE',
      }, token);

      toast({
        title: 'Berhasil',
        description: 'Kendaraan berhasil dihapus',
      });

      setShowDeleteModal(false);
      setDeleteVehicleId(null);
      fetchVehicles();
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (vehicle: Record<string, unknown>) => {
    setEditVehicle({
      id: vehicle.id as string,
      plateNumber: vehicle.plateNumber as string,
      brand: vehicle.brand as string,
      model: vehicle.model as string,
      year: (vehicle.year as number).toString(),
      color: vehicle.color as string,
      status: vehicle.status as string,
      assignedToId: (vehicle.assignedTo as Record<string, unknown>)?.id as string || '__none__',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (vehicleId: string) => {
    setDeleteVehicleId(vehicleId);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-500">Tersedia</Badge>;
      case 'IN_USE':
        return <Badge className="bg-blue-500">Digunakan</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-red-500">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Data Kendaraan</h2>
          <p className="text-muted-foreground text-sm">Kelola armada kendaraan</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id as string}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <Car className="h-6 w-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{vehicle.plateNumber as string}</p>
                        {getStatusBadge(vehicle.status as string)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand as string} {vehicle.model as string} ({vehicle.year as number})
                      </p>
                      <p className="text-sm text-muted-foreground">Warna: {vehicle.color as string}</p>
                      {vehicle.assignedTo && (
                        <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{(vehicle.assignedTo as Record<string, unknown>).name as string}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(vehicle)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(vehicle.id as string)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Add Vehicle Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kendaraan</DialogTitle>
            <DialogDescription>
              Tambahkan kendaraan baru
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Plat</Label>
              <Input
                value={newVehicle.plateNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                placeholder="B 1234 BI"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merk</Label>
                <Input
                  value={newVehicle.brand}
                  onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="Innova"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Warna</Label>
                <Input
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  placeholder="Hitam"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button onClick={handleAddVehicle} disabled={!newVehicle.plateNumber || !newVehicle.brand || !newVehicle.model || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kendaraan</DialogTitle>
            <DialogDescription>
              Perbarui data kendaraan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomor Plat</Label>
              <Input
                value={editVehicle.plateNumber}
                onChange={(e) => setEditVehicle({ ...editVehicle, plateNumber: e.target.value })}
                placeholder="B 1234 BI"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merk</Label>
                <Input
                  value={editVehicle.brand}
                  onChange={(e) => setEditVehicle({ ...editVehicle, brand: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={editVehicle.model}
                  onChange={(e) => setEditVehicle({ ...editVehicle, model: e.target.value })}
                  placeholder="Innova"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input
                  type="number"
                  value={editVehicle.year}
                  onChange={(e) => setEditVehicle({ ...editVehicle, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Warna</Label>
                <Input
                  value={editVehicle.color}
                  onChange={(e) => setEditVehicle({ ...editVehicle, color: e.target.value })}
                  placeholder="Hitam"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editVehicle.status} onValueChange={(value) => setEditVehicle({ ...editVehicle, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                  <SelectItem value="IN_USE">Digunakan</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Driver Assigned</Label>
              <Select value={editVehicle.assignedToId} onValueChange={(value) => setEditVehicle({ ...editVehicle, assignedToId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih driver (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tidak ada</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id as string} value={driver.id as string}>
                      {driver.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button onClick={handleEditVehicle} disabled={!editVehicle.plateNumber || !editVehicle.brand || !editVehicle.model || isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kendaraan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kendaraan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin Bookings Management
function AdminBookings({ token }: { token: string }) {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, [token, filter]);

  const fetchBookings = async () => {
    try {
      const url = filter !== 'all' ? `/bookings?status=${filter}` : '/bookings';
      const data = await api(url, {}, token);
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Menunggu</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-orange-500">Berlangsung</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Riwayat Perjalanan</h2>
        <p className="text-muted-foreground text-sm">Data semua perjalanan</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="whitespace-nowrap"
          >
            {status === 'all' ? 'Semua' : 
             status === 'PENDING' ? 'Menunggu' :
             status === 'APPROVED' ? 'Disetujui' :
             status === 'IN_PROGRESS' ? 'Berlangsung' :
             status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-3 pr-4">
            {bookings.map((booking) => (
              <Card key={booking.id as string}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(booking.employee as Record<string, unknown>).name.toString().charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{(booking.employee as Record<string, unknown>).name as string}</p>
                        <p className="text-sm text-muted-foreground">Karyawan</p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status as string)}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>{booking.pickupLocation as string}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flag className="h-4 w-4 text-red-500" />
                      <span>{booking.destination as string}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.bookingDate as string)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{booking.bookingTime as string}</span>
                      </div>
                    </div>
                    {booking.driver && (
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>{(booking.driver as Record<string, unknown>).name as string}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Account Page
function AccountPage({ token, user, onUserUpdate }: { token: string; user: User; onUserUpdate: (user: User) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const data = await api(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      }, token);
      
      onUserUpdate(data.user);
      setIsEditing(false);
      
      toast({
        title: 'Berhasil',
        description: 'Profil berhasil diperbarui',
      });
    } catch (error) {
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'DRIVER':
        return 'Driver';
      case 'EMPLOYEE':
        return 'Karyawan';
      default:
        return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Akun Saya</h2>
        <p className="text-muted-foreground text-sm">Kelola profil Anda</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{getRoleName(user.role)}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {user.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {user.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telepon</Label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user.phone || '-'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                {getRoleName(user.role)}
              </div>
            </div>

            {isEditing ? (
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                  Batal
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            ) : (
              <Button className="w-full mt-4" onClick={() => setIsEditing(true)}>
                Edit Profil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Leaderboard
function AdminLeaderboard({ token }: { token: string }) {
  const [leaderboardData, setLeaderboardData] = useState<{
    filter: { year: number; month: number | null };
    current: { year: number; month: number };
    availableYears: number[];
    monthNames: string[];
    employees: Array<Record<string, unknown>>;
    drivers: Array<Record<string, unknown>>;
    vehicles: Array<Record<string, unknown>>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'drivers' | 'vehicles'>('employees');
  const [periodFilter, setPeriodFilter] = useState<'monthly' | 'yearly' | 'total'>('total');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const { toast } = useToast();

  const fetchLeaderboard = async (year?: number, month?: number | null) => {
    setIsLoading(true);
    try {
      let endpoint = '/leaderboard';
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      if (params.toString()) endpoint += `?${params.toString()}`;
      
      const data = await api(endpoint, {}, token);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'Gagal',
        description: 'Gagal memuat data leaderboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedYear, periodFilter === 'monthly' ? selectedMonth : null);
  }, [token, selectedYear, selectedMonth, periodFilter]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">1</div>;
    } else if (rank === 2) {
      return <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold">2</div>;
    } else if (rank === 3) {
      return <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">3</div>;
    }
    return <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600">{rank}</div>;
  };

  if (isLoading || !leaderboardData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentData = activeTab === 'employees' 
    ? leaderboardData.employees 
    : activeTab === 'drivers' 
      ? leaderboardData.drivers 
      : leaderboardData.vehicles;

  const sortedData = [...currentData].sort((a, b) => {
    if (periodFilter === 'monthly') return (b.monthly as number) - (a.monthly as number);
    if (periodFilter === 'yearly') return (b.yearly as number) - (a.yearly as number);
    return (b.total as number) - (a.total as number);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-muted-foreground text-sm">Peringkat penggunaan terbanyak</p>
      </div>

      {/* Period Filter */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'total', label: 'Total' },
            { id: 'yearly', label: 'Tahunan' },
            { id: 'monthly', label: 'Bulanan' },
          ].map((p) => (
            <Button
              key={p.id}
              variant={periodFilter === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodFilter(p.id as 'monthly' | 'yearly' | 'total')}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Year Filter - shown for yearly and monthly */}
        {(periodFilter === 'yearly' || periodFilter === 'monthly') && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">Tahun:</Label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaderboardData.availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Month Filter - shown only for monthly */}
        {periodFilter === 'monthly' && (
          <div className="flex gap-2 items-center">
            <Label className="text-sm whitespace-nowrap">Bulan:</Label>
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaderboardData.monthNames.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Active Filter Display */}
      <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {periodFilter === 'total' && 'Periode: Semua Waktu'}
            {periodFilter === 'yearly' && `Periode: Tahun ${selectedYear}`}
            {periodFilter === 'monthly' && `Periode: ${leaderboardData.monthNames[selectedMonth - 1]} ${selectedYear}`}
          </span>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        {[
          { id: 'employees', label: 'Karyawan', icon: Users },
          { id: 'drivers', label: 'Driver', icon: Car },
          { id: 'vehicles', label: 'Kendaraan', icon: Truck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'employees' | 'drivers' | 'vehicles')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2',
              activeTab === tab.id ? 'bg-white shadow-sm' : 'text-muted-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      {sortedData.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada data untuk ditampilkan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedData.map((item, index) => (
            <Card key={item.id as string} className={cn(
              index === 0 && 'border-yellow-200 bg-yellow-50/50',
              index === 1 && 'border-slate-200 bg-slate-50/50',
              index === 2 && 'border-amber-200 bg-amber-50/50',
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {getRankBadge(index + 1)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {activeTab === 'vehicles' ? (
                        <>
                          <Car className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.plateNumber as string}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.brand as string} {item.model as string} ({item.year as number})
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {(item.name as string).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{item.name as string}</p>
                            <p className="text-sm text-muted-foreground">
                              {activeTab === 'drivers' && item.vehicle && (
                                <span className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  {(item.vehicle as Record<string, unknown>).plateNumber as string}
                                </span>
                              )}
                              {activeTab === 'employees' && (item.email as string)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {periodFilter === 'monthly' ? item.monthly : periodFilter === 'yearly' ? item.yearly : item.total}
                    </p>
                    <p className="text-xs text-muted-foreground">perjalanan</p>
                  </div>
                </div>
                
                {/* Stats breakdown */}
                <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="font-bold text-slate-700">{item.monthly as number}</p>
                    <p className="text-muted-foreground">Bulanan</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="font-bold text-slate-700">{item.yearly as number}</p>
                    <p className="text-muted-foreground">Tahunan</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="font-bold text-slate-700">{item.total as number}</p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Main App Component
export default function DriverBookingApp() {
  const { user, token, isAuthenticated, login, logout, setUser } = useAuthStore();
  const [currentView, setCurrentView] = useState('dashboard');

  // Handle login
  const handleLogin = (userData: User, tokenData: string) => {
    login(userData, tokenData);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
  };

  // If not authenticated, show login page
  if (!isAuthenticated || !user || !token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Render content based on role and current view
  const renderContent = () => {
    // Employee views
    if (user.role === 'EMPLOYEE') {
      switch (currentView) {
        case 'history':
          return <EmployeeHistory token={token} />;
        case 'account':
          return <AccountPage token={token} user={user} onUserUpdate={setUser} />;
        default:
          return <EmployeeDashboard token={token} user={user} onViewChange={setCurrentView} />;
      }
    }

    // Driver views
    if (user.role === 'DRIVER') {
      switch (currentView) {
        case 'history':
          return <DriverHistory token={token} />;
        case 'account':
          return <AccountPage token={token} user={user} onUserUpdate={setUser} />;
        default:
          return <DriverDashboard token={token} user={user} onViewChange={setCurrentView} />;
      }
    }

    // Admin views
    if (user.role === 'ADMIN') {
      switch (currentView) {
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
