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
import { Car, History, Bell, User as UserIcon, Navigation as NavigationIcon, Plane, Hotel, Calendar, BarChart3 } from 'lucide-react';
import { WelcomeBanner } from '@/components/shared/welcome-banner';
import { QuickActionsGrid } from '@/components/shared/quick-actions-grid';
import { TravelDetailCard } from '@/components/shared/travel-detail-card';
import { TripRating } from '@/components/shared/trip-rating';
import { MapVisualization } from '@/components/shared/map-visualization';
import { GPSMapWrapper } from '@/components/shared/gps-map-wrapper';

interface EmployeeDashboardProps {
  token: string;
  user: User;
}

export function EmployeeDashboard({ token, user }: EmployeeDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState({ totalBookings: 0, pendingBookings: 0, completedBookings: 0, inProgressBookings: 0 });
  const [activeBooking, setActiveBooking] = useState<Record<string, unknown> | null>(null);
  const [gpsWaypoints, setGpsWaypoints] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [liveUserLocation, setLiveUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
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
        ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING'].includes(b.status as string)
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

  // Track live user location when there's an active booking (before and during trip)
  useEffect(() => {
    if (!activeBooking) {
      setLiveUserLocation(null);
      return;
    }

    const shouldTrackLiveLocation = ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING'].includes(
      activeBooking.status as string
    );

    if (!shouldTrackLiveLocation) {
      return;
    }

    let watchId: number | null = null;

    // Request location permission and start tracking
    const startTracking = async () => {
      if ('geolocation' in navigator) {
        try {
          // Request permission with high accuracy
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });

          setLiveUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationPermissionGranted(true);

          // Start watching position for real-time updates
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              setLiveUserLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            },
            (error) => {
              console.error('Error watching position:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000,
            }
          );

        } catch (error) {
          console.error('Error getting location:', error);
          toast({
            title: 'Akses Lokasi Ditolak',
            description: 'Untuk melihat lokasi Anda di peta, izinkan akses lokasi di browser.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'GPS Tidak Tersedia',
          description: 'Perangkat Anda tidak mendukung GPS.',
          variant: 'destructive',
        });
      }
    };

    startTracking();

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeBooking, toast]);

  // Load GPS waypoints when active booking changes
  useEffect(() => {
    if (activeBooking && activeBooking.id && ['APPROVED', 'DEPARTED', 'ARRIVED', 'RETURNING'].includes(activeBooking.status as string)) {
      const loadWaypoints = async () => {
        setIsLoadingGPS(true);
        try {
          const response = await api(`/gps?bookingId=${activeBooking.id}`, {}, token);
          setGpsWaypoints(response.waypoints || []);
        } catch (error) {
          console.error('Error loading GPS waypoints:', error);
          setGpsWaypoints([]);
        } finally {
          setIsLoadingGPS(false);
        }
      };
      loadWaypoints();
      // Refresh GPS data every 10 seconds for active trips
      const gpsInterval = setInterval(loadWaypoints, 10000);
      return () => clearInterval(gpsInterval);
    } else {
      setGpsWaypoints([]);
    }
  }, [activeBooking, token]);

  const handleBooking = async () => {
    setIsSubmitting(true);
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingForm),
      }, token);

      toast({
        title: 'Pesanan Berhasil Dibuat',
        description: 'Notifikasi telah dikirim ke semua driver yang tersedia. Driver tercepat akan menerima pesanan Anda.',
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
    {
      icon: Plane,
      label: 'Booking Tiket Pesawat',
      color: 'bg-cyan-600',
      action: () => window.open('https://forms.office.com/r/VapKhrJPNQ?origin=lprLink', '_blank', 'noopener,noreferrer'),
    },
    {
      icon: Hotel,
      label: 'Room Booking',
      color: 'bg-pink-600',
      action: () => window.open('https://form.jotform.com/253031772227048', '_blank', 'noopener,noreferrer'),
    },
    {
      icon: Calendar,
      label: 'Cuti',
      color: 'bg-amber-600',
      action: () => window.open('https://form.jotform.com/253171927374462', '_blank', 'noopener,noreferrer'),
    },
    {
      icon: BarChart3,
      label: 'Dashboard Monitoring',
      color: 'bg-indigo-600',
      action: () => router.push('/employee/monitoring'),
    },
  ];

  // Helper function to parse coordinates
  const parseCoords = (coordsStr: string | null) => {
    if (!coordsStr) return null;
    try {
      if (typeof coordsStr === 'object') return coordsStr as { lat: number; lng: number; name?: string };
      const parsed = JSON.parse(coordsStr as string);
      return parsed;
    } catch {
      return null;
    }
  };

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
            {/* GPS Map Visualization - Always show for non-PENDING trips */}
            {(activeBooking.status as string) !== 'PENDING' && (
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      🗺️ Peta Perjalanan Real-time
                      {isLoadingGPS && <span className="text-xs text-muted-foreground">(Memuat...)</span>}
                      {!isLoadingGPS && gpsWaypoints.length > 0 && (
                        <span className="text-xs text-muted-foreground">({gpsWaypoints.length} titik lokasi)</span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gpsWaypoints.length === 0 
                        ? '📍 Menampilkan lokasi Anda saat ini. Rute akan muncul saat driver mulai perjalanan.'
                        : 'Peta menampilkan rute perjalanan driver secara real-time'
                      }
                    </p>
                  </div>
                  {(() => {
                    const pickupCoords = parseCoords(activeBooking.pickupCoords as string);
                    const destinationCoords = parseCoords(activeBooking.destinationCoords as string);
                    const currentCoords = parseCoords(activeBooking.currentCoords as string);
                    
                    const pickupData = pickupCoords
                      ? { lat: pickupCoords.lat, lng: pickupCoords.lng, name: activeBooking.pickupLocation as string }
                      : null;
                    const destinationData = destinationCoords
                      ? { lat: destinationCoords.lat, lng: destinationCoords.lng, name: activeBooking.destination as string }
                      : null;

                    // Only show pickup/destination markers when journey has started (has waypoints)
                    const hasStarted = gpsWaypoints.length > 0;

                    return (
                      <GPSMapWrapper
                        waypoints={gpsWaypoints.map((w: Record<string, unknown>) => ({
                          id: w.id as string,
                          latitude: w.latitude as number,
                          longitude: w.longitude as number,
                          accuracy: w.accuracy as number | undefined,
                          timestamp: w.timestamp as string,
                          status: w.status as string | undefined, // Status booking saat waypoint direkam
                        }))}
                        pickup={pickupData}
                        destination={destinationData}
                        currentLocation={currentCoords ? { latitude: currentCoords.lat, longitude: currentCoords.lng } : undefined}
                        liveUserLocation={liveUserLocation}
                        height="h-80"
                        showPickupDestination={hasStarted}
                      />
                    );
                  })()}
                  {!isLoadingGPS && gpsWaypoints.length === 0 && liveUserLocation && (
                    <p className="text-xs text-center text-green-600 mt-2 p-2 bg-green-50 rounded border border-green-200">
                      ✓ Lokasi Anda terdeteksi. Menunggu driver memulai perjalanan...
                    </p>
                  )}
                  {!isLoadingGPS && gpsWaypoints.length === 0 && !liveUserLocation && !locationPermissionGranted && (
                    <p className="text-xs text-center text-amber-600 mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                      ℹ️ Izinkan akses lokasi untuk melihat posisi Anda di peta
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Travel Detail Card */}
            <TravelDetailCard 
              booking={activeBooking}
              showDriver={true}
              token={token}
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
        <DialogContent className="max-w-md z-50">
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
