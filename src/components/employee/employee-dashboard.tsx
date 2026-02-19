'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Car, History, Bell, User as UserIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadgeDriver } from '@/components/shared/status-badges';
import { WelcomeBanner } from '@/components/shared/welcome-banner';
import { QuickActionsGrid } from '@/components/shared/quick-actions-grid';
import { LoadingSkeleton } from '@/components/shared/loading';

interface EmployeeDashboardProps {
  token: string;
  user: User;
}

export function EmployeeDashboard({ token, user }: EmployeeDashboardProps) {
  const router = useRouter();
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

  const quickActions = [
    { icon: Car, label: 'Pesan Driver', color: 'bg-blue-500', action: () => {} },
    { icon: History, label: 'Riwayat', color: 'bg-green-500', action: () => router.push('/employee/history') },
    { icon: Bell, label: 'Notifikasi', color: 'bg-orange-500', action: () => {} },
    { icon: UserIcon, label: 'Profil', color: 'bg-purple-500', action: () => router.push('/employee/account') },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={`Selamat Datang, ${user.name}!`}
        subtitle="Pesan driver untuk perjalanan Anda"
        stats={[
          { value: stats.totalBookings, label: 'Total Pesanan' },
          { value: stats.pendingBookings, label: 'Menunggu', color: 'text-yellow-400' },
          { value: stats.completedBookings, label: 'Selesai', color: 'text-green-400' },
        ]}
      />

      <QuickActionsGrid actions={quickActions} />

      {/* Available Drivers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Driver Tersedia</h3>
          <Button variant="ghost" size="sm" className="text-sm text-primary">
            Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} />
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
                      <StatusBadgeDriver status={driver.availabilityStatus as string} />
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
