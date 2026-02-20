'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Car, History, Bell, User as UserIcon, Navigation as NavigationIcon } from 'lucide-react';
import { WelcomeBanner } from '@/components/shared/welcome-banner';
import { QuickActionsGrid } from '@/components/shared/quick-actions-grid';
import { TravelDetailCard } from '@/components/shared/travel-detail-card';
import { TripRating } from '@/components/shared/trip-rating';
import { MapVisualization } from '@/components/shared/map-visualization';

interface EmployeeDashboardProps {
  token: string;
  user: User;
}

export function EmployeeDashboard({ token, user }: EmployeeDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, completedBookings: 0, inProgressBookings: 0 });
  const [activeBooking, setActiveBooking] = useState<Record<string, unknown> | null>(null);
  const [bookingForm, setBookingForm] = useState({
    pickupLocation: '',
    destination: '',
    bookingDate: '',
    bookingTime: '',
    notes: '',
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const openBookingModal = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    setBookingForm((prev) => ({ ...prev, bookingDate: date, bookingTime: time }));
    setIsBookingModalOpen(true);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [statsData, bookingsData] = await Promise.all([
        api('/stats', {}, token),
        api('/bookings', {}, token),
      ]);
      setStats(statsData);
      
      // Get active booking
      const active = bookingsData.bookings.find((b: Record<string, unknown>) => 
        ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING', 'COMPLETED'].includes(b.status as string)
      );
      setActiveBooking(active || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleBooking = async () => {
    setIsSubmitting(true);
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingForm),
      }, token);

      toast({
        title: 'Pemesanan Berhasil',
        description: 'Pemesanan driver telah dikirim. Driver akan ditentukan secara otomatis.',
      });

      setIsBookingModalOpen(false);
      setBookingForm({
        pickupLocation: '',
        destination: '',
        bookingDate: '',
        bookingTime: '',
        notes: '',
      });
      
      await fetchData();
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
    { icon: Car, label: 'Pesan Driver', color: 'bg-blue-500', action: openBookingModal },
    { icon: History, label: 'Riwayat', color: 'bg-green-500', action: () => router.push('/employee/history') },
    { icon: Bell, label: 'Notifikasi', color: 'bg-orange-500', action: () => router.push('/employee/notifications') },
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

      {/* Active Trip with Map */}
      {activeBooking && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <NavigationIcon className="h-5 w-5 text-orange-500" />
            Perjalanan Anda
          </h3>
          
          <div className="space-y-3">
            {/* Map Visualization */}
            {(activeBooking.status as string) !== 'PENDING' && (
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <MapVisualization 
                    pickup={activeBooking.pickupCoords as { lat: number; lng: number; name: string } | null}
                    destination={activeBooking.destinationCoords as { lat: number; lng: number; name: string } | null}
                    currentStatus={activeBooking.status as string}
                  />
                </CardContent>
              </Card>
            )}

            {/* Travel Detail Card */}
            <TravelDetailCard 
              booking={activeBooking}
              showDriver={true}
            />

            {/* Rating Form for Completed Trip */}
            {(activeBooking.status as string) === 'COMPLETED' && !activeBooking.rating && (
              <TripRating 
                bookingId={activeBooking.id as string}
                token={token}
                onRatingSubmitted={fetchData}
              />
            )}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pesan Driver</DialogTitle>
            <DialogDescription>
              Isi detail perjalanan Anda. Driver akan dipilih secara otomatis dari yang tersedia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Waktu Pemesanan</p>
              <p className="font-medium">
                {bookingForm.bookingDate && bookingForm.bookingTime
                  ? new Date(`${bookingForm.bookingDate}T${bookingForm.bookingTime}`).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </p>
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
              disabled={isSubmitting || !bookingForm.pickupLocation || !bookingForm.destination}
            >
              {isSubmitting ? 'Memproses...' : 'Pesan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
