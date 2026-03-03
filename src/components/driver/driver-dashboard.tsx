'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@/lib/auth-store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Car, History, Bell, MapPin, Calendar, Clock, Check, XCircle, 
  Flag, Truck, Wrench, User as UserIcon, 
  Navigation as NavigationIcon, RotateCcw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WelcomeBanner } from '@/components/shared/welcome-banner';
import { QuickActionsGrid } from '@/components/shared/quick-actions-grid';
import { LoadingSpinner } from '@/components/shared/loading';
import { GPSMapWrapper } from '@/components/shared/gps-map-wrapper';
import { GPSPermissionDialog } from '@/components/shared/gps-permission-dialog';

interface DriverDashboardProps {
  token: string;
  user: User;
}

export function DriverDashboard({ token, user }: DriverDashboardProps) {
  const GPS_PERMISSION_KEY = 'gpsPermissionGranted';
  const router = useRouter();
  const [pendingBookings, setPendingBookings] = useState<Array<Record<string, unknown>>>([]);
  const [activeBooking, setActiveBooking] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState({ pendingBookings: 0, completedBookings: 0, todayBookings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogBookModal, setShowLogBookModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showGPSPermissionDialog, setShowGPSPermissionDialog] = useState(false);
  const [showOdometerModal, setShowOdometerModal] = useState(false);
  const [gpsAction, setGPSAction] = useState<'depart' | 'arrive' | 'returning' | 'complete' | null>(null);
  const [isRequestingGPS, setIsRequestingGPS] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Record<string, unknown> | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Array<Record<string, unknown>>>([]);
  const [odometerValue, setOdometerValue] = useState<string>('');
  const [pendingOdometerValue, setPendingOdometerValue] = useState<number | null>(null);
  const [pendingOdometerAction, setPendingOdometerAction] = useState<'depart' | 'complete' | null>(null);
  const [liveDriverLocation, setLiveDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [logBookForm, setLogBookForm] = useState({
    vehicleId: '__select__',
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Track live driver location when there's an active booking (APPROVED status, before departure)
  useEffect(() => {
    if (!activeBooking) {
      setLiveDriverLocation(null);
      return;
    }

    // Only track live location for APPROVED status (before journey starts)
    const shouldTrackLiveLocation = (activeBooking.status as string) === 'APPROVED';

    if (!shouldTrackLiveLocation) {
      setLiveDriverLocation(null);
      return;
    }

    // Start watching position for real-time updates
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLiveDriverLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error watching driver position:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      // Initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLiveDriverLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting driver position:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [activeBooking]);

  const normalizeCoords = (value: unknown) => {
    if (!value) return null;
    const raw = (() => {
      if (typeof value === 'object') return value as Record<string, unknown>;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
      return null;
    })();

    if (!raw) return null;
    const lat = raw.lat ?? raw.latitude;
    const lng = raw.lng ?? raw.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return { lat, lng };
  };

  const isGpsPermissionGranted = async () => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(GPS_PERMISSION_KEY) === 'true';
    if (!('permissions' in navigator)) return stored;
    try {
      const status = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      if (status.state === 'granted') {
        localStorage.setItem(GPS_PERMISSION_KEY, 'true');
        return true;
      }
      return stored;
    } catch {
      return stored;
    }
  };

  const runGpsAction = async (action: 'depart' | 'arrive' | 'returning' | 'complete', odometer?: number) => {
    if (!activeBooking) return;

    setIsRequestingGPS(true);
    setLoadingAction(action);
    try {
      const statusMap: Record<string, string> = {
        depart: 'DEPARTED',
        arrive: 'ARRIVED',
        returning: 'RETURNING',
        complete: 'COMPLETED',
      };

      // Record GPS location when updating status
      let gpsData: Record<string, unknown> = { 
        status: statusMap[action],
        ...(odometer && action === 'depart' && { startOdometer: odometer }),
        ...(odometer && action === 'complete' && { endOdometer: odometer }),
      };
      
      // Get current location using geolocation API
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });

          const { latitude, longitude, accuracy } = position.coords;

          // Save GPS waypoint
          await api('/gps', {
            method: 'POST',
            body: JSON.stringify({
              bookingId: activeBooking.id,
              latitude,
              longitude,
              accuracy,
            }),
          }, token);

          // Also save in booking update
          gpsData.currentCoords = {
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
          };

          if (typeof window !== 'undefined') {
            localStorage.setItem(GPS_PERMISSION_KEY, 'true');
          }

          toast({
            title: 'Lokasi Terekam',
            description: 'Koordinat GPS berhasil disimpan',
          });
        } catch (gpsError) {
          console.warn('Could not get GPS location:', gpsError);
          toast({
            title: 'Peringatan',
            description: 'GPS tidak dapat diakses, namun status tetap akan diupdate',
            variant: 'default',
          });
          // Continue with status update even if GPS fails
        }
      }

      // Update booking status
      const response = await api(`/bookings/${activeBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify(gpsData),
      }, token);

      // Verify the response is successful
      if (!response || !response.booking) {
        throw new Error('Gagal memperbarui status perjalanan. Silakan coba lagi.');
      }

      const actionMessages: Record<string, string> = {
        depart: 'dimulai - sedang menuju lokasi penjemputan',
        arrive: 'tiba di tujuan',
        returning: 'sedang kembali',
        complete: 'selesai',
      };

      toast({
        title: 'Berhasil',
        description: `Pesanan telah ${actionMessages[action]}`,
      });

      // Close dialogs and refresh
      setShowGPSPermissionDialog(false);
      setShowOdometerModal(false);
      setGPSAction(null);
      setPendingOdometerAction(null);
      setPendingOdometerValue(null);
      setOdometerValue('');
      
      // Wait a moment and refresh data
      await new Promise(resolve => setTimeout(resolve, 800));
      await fetchData();
    } catch (error) {
      console.error('GPS action error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memperbarui status perjalanan';
      
      toast({
        title: 'Gagal',
        description: errorMessage,
        variant: 'destructive',
      });

      // Ensure modals are closed on error for complete action to prevent looping
      if (action === 'complete') {
        setShowOdometerModal(false);
        setShowGPSPermissionDialog(false);
        setOdometerValue('');
        setPendingOdometerAction(null);
        setPendingOdometerValue(null);
      }
    } finally {
      setIsRequestingGPS(false);
      setLoadingAction(null);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject' | 'depart' | 'arrive' | 'returning' | 'complete') => {
    if (action === 'approve') {
      const booking = pendingBookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
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

    // For odometer-requiring actions, show odometer input dialog first
    if (['depart', 'complete'].includes(action)) {
      setOdometerValue('');
      setPendingOdometerAction(action as 'depart' | 'complete');
      setShowOdometerModal(true);
      return;
    }

    // For other GPS-requiring actions, show permission dialog only once
    if (['arrive', 'returning'].includes(action)) {
      const nextAction = action as 'arrive' | 'returning';
      const granted = await isGpsPermissionGranted();
      if (granted) {
        await runGpsAction(nextAction);
        return;
      }
      setGPSAction(nextAction);
      setShowGPSPermissionDialog(true);
      return;
    }
  };

  const handleGPSPermissionAllow = async () => {
    if (!gpsAction) return;
    await runGpsAction(gpsAction, pendingOdometerValue || undefined);
  };

  const handleGPSPermissionDeny = () => {
    setShowGPSPermissionDialog(false);
    setGPSAction(null);
    setPendingOdometerValue(null);
    toast({
      title: 'GPS Ditolak',
      description: 'Anda perlu mengizinkan akses GPS untuk melanjutkan',
      variant: 'default',
    });
  };

  const handleOdometerSubmit = async () => {
    if (!odometerValue.trim() || !pendingOdometerAction) {
      toast({
        title: 'Peringatan',
        description: 'Silakan masukkan nilai odometer',
        variant: 'destructive',
      });
      return;
    }

    const odometerNum = parseInt(odometerValue);
    if (isNaN(odometerNum) || odometerNum < 0) {
      toast({
        title: 'Peringatan',
        description: 'Nilai odometer harus berupa angka positif',
        variant: 'destructive',
      });
      return;
    }

    // Check if odometer is consistent
    if (pendingOdometerAction === 'complete' && activeBooking?.startOdometer) {
      const startOdometer = Number(activeBooking.startOdometer);
      if (odometerNum < startOdometer) {
        toast({
          title: 'Peringatan',
          description: `Odometer akhir (${odometerNum} km) tidak boleh kurang dari odometer awal (${startOdometer} km)`,
          variant: 'destructive',
        });
        return;
      }
    }

    const granted = await isGpsPermissionGranted();
    if (granted) {
      await runGpsAction(pendingOdometerAction, odometerNum);
      return;
    }

    // Store odometer value for later use when GPS permission is granted
    setPendingOdometerValue(odometerNum);
    setGPSAction(pendingOdometerAction as any);
    setShowOdometerModal(false);
    setShowGPSPermissionDialog(true);
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
        title: 'Pesanan Diterima',
        description: 'Anda telah mengkonfirmasi pesanan. Status pesanan telah menjadi APPROVED.',
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
      if (!logBookForm.vehicleId || logBookForm.vehicleId === '__select__') {
        toast({
          title: 'Gagal',
          description: 'Silakan pilih kendaraan',
          variant: 'destructive',
        });
        return;
      }

      if (!logBookForm.description.trim()) {
        toast({
          title: 'Gagal',
          description: 'Silakan isi deskripsi',
          variant: 'destructive',
        });
        return;
      }

      await api('/logbooks', {
        method: 'POST',
        body: JSON.stringify({
          ...logBookForm,
          vehicleId: logBookForm.vehicleId === '__select__' ? '' : logBookForm.vehicleId,
        }),
      }, token);

      toast({
        title: 'Berhasil',
        description: 'LogBook telah dicatat',
      });

      setShowLogBookModal(false);
      setLogBookForm({
        vehicleId: '__select__',
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
    { icon: History, label: 'Riwayat', color: 'bg-green-500', action: () => router.push('/driver/history') },
    { icon: Truck, label: 'Kendaraan', color: 'bg-orange-500', action: () => {} },
    { icon: UserIcon, label: 'Profil', color: 'bg-purple-500', action: () => router.push('/driver/account') },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner
        name={`Halo, ${user.name}!`}
        subtitle="Ada pesanan yang menunggu Anda"
        stats={[
          { value: stats.pendingBookings, label: 'Menunggu', color: 'text-yellow-400' },
          { value: stats.todayBookings, label: 'Hari Ini' },
          { value: stats.completedBookings, label: 'Selesai', color: 'text-green-400' },
        ]}
      />

      <QuickActionsGrid actions={quickActions} />

      {/* Active Trip with Map */}
      {activeBooking && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <NavigationIcon className="h-5 w-5 text-orange-500" />
            Perjalanan Aktif
          </h3>
          <Card className="border-orange-200">
            <CardContent className="p-4 space-y-4">
              {(() => {
                const pickupCoords = normalizeCoords(activeBooking.pickupCoords);
                const destinationCoords = normalizeCoords(activeBooking.destinationCoords);
                const currentCoords = normalizeCoords(activeBooking.currentCoords);
                const pickup = pickupCoords
                  ? { lat: pickupCoords.lat, lng: pickupCoords.lng, name: activeBooking.pickupLocation as string }
                  : null;
                const destination = destinationCoords
                  ? { lat: destinationCoords.lat, lng: destinationCoords.lng, name: activeBooking.destination as string }
                  : null;
                const currentLocation = currentCoords
                  ? { latitude: currentCoords.lat, longitude: currentCoords.lng }
                  : null;

                if (!pickup && !destination) {
                  return (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-600 text-center">Koordinat lokasi belum tersedia</p>
                    </div>
                  );
                }

                return (
                  <GPSMapWrapper
                    waypoints={[]}
                    pickup={pickup}
                    destination={destination}
                    currentLocation={currentLocation}
                    liveUserLocation={liveDriverLocation}
                    height="h-64"
                    showPickupDestination={false}
                  />
                );
              })()}

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
                {activeBooking.vehicle ? (
                  <div className="flex items-center gap-2 text-muted-foreground p-2 bg-slate-50 rounded-lg">
                    <Car className="h-4 w-4" />
                    <span>{(activeBooking.vehicle as Record<string, unknown>).brand as string} - {(activeBooking.vehicle as Record<string, unknown>).plateNumber as string}</span>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons based on status */}
              <div className="space-y-2">
                {activeBooking.status === 'APPROVED' && (
                  <Button 
                    className="w-full bg-cyan-600 hover:bg-cyan-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'depart')}
                    disabled={loadingAction === 'depart'}
                  >
                    {loadingAction === 'depart' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <NavigationIcon className="h-4 w-4 mr-2" />
                        Mulai Keberangkatan
                      </>
                    )}
                  </Button>
                )}
                
                {activeBooking.status === 'DEPARTED' && (
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'arrive')}
                    disabled={loadingAction === 'arrive'}
                  >
                    {loadingAction === 'arrive' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4 mr-2" />
                        Konfirmasi Tiba di Tujuan
                      </>
                    )}
                  </Button>
                )}
                
                {activeBooking.status === 'ARRIVED' && (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'returning')}
                    disabled={loadingAction === 'returning'}
                  >
                    {loadingAction === 'returning' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Mulai Kembali
                      </>
                    )}
                  </Button>
                )}
                
                {activeBooking.status === 'RETURNING' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => handleBookingAction(activeBooking.id as string, 'complete')}
                    disabled={loadingAction === 'complete'}
                  >
                    {loadingAction === 'complete' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Selesaikan Perjalanan
                      </>
                    )}
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
              <Card key={booking.id as string} className={`border-yellow-200 ${!booking.driverId ? 'border-2 border-green-400' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {(booking.employee as Record<string, unknown>).name?.toString().charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{(booking.employee as Record<string, unknown>).name as string}</p>
                          {!booking.driverId && (
                            <Badge className="bg-green-600 text-xs">Open</Badge>
                          )}
                        </div>
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
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle>Catat LogBook</DialogTitle>
            <DialogDescription>
              Catat aktivitas kendaraan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kendaraan</Label>
              {vehicles.length === 0 ? (
                <div className="h-10 w-full px-3 py-2 border border-input rounded-md bg-muted text-muted-foreground text-sm flex items-center">
                  Tidak ada kendaraan tersedia
                </div>
              ) : (
                <Select 
                  value={logBookForm.vehicleId} 
                  onValueChange={(value) => setLogBookForm({ ...logBookForm, vehicleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kendaraan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__select__">Pilih kendaraan</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id as string} value={v.id as string}>
                        {v.brand as string} - {v.plateNumber as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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

            {logBookForm.type === 'FUEL' ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <p className="text-sm text-blue-900">
                  Untuk pengisian BBM, silakan isi form menggunakan link di bawah:
                </p>
                <a
                  href="https://forms.gle/y6duajzgovPbBmkJ9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Buka Form Pengisian BBM
                </a>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogBookModal(false)}>
              Batal
            </Button>
            {logBookForm.type !== 'FUEL' && (
              <Button 
                onClick={handleLogBookSubmit}
                disabled={!logBookForm.vehicleId || !logBookForm.description}
              >
                Simpan
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Booking Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle>Terima Pesanan Driver</DialogTitle>
            <DialogDescription>
              Konfirmasi pesanan dan pilih kendaraan untuk perjalanan ini
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
        <DialogContent className="max-w-md z-50">
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

      {/* Odometer Input Modal */}
      <Dialog open={showOdometerModal} onOpenChange={setShowOdometerModal}>
        <DialogContent className="max-w-md z-50">
          <DialogHeader>
            <DialogTitle>
              {pendingOdometerAction === 'depart' 
                ? 'Input Odometer Awal' 
                : 'Input Odometer Akhir'}
            </DialogTitle>
            <DialogDescription>
              {pendingOdometerAction === 'depart' 
                ? 'Silakan masukkan nilai odometer sebelum perjalanan dimulai' 
                : 'Silakan masukkan nilai odometer setelah perjalanan selesai'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nilai Odometer (km) *</Label>
              <Input
                type="number"
                placeholder="Contoh: 45000"
                value={odometerValue}
                onChange={(e) => setOdometerValue(e.target.value)}
                min="0"
              />
              {activeBooking?.startOdometer != null && pendingOdometerAction === 'complete' && (
                <p className="text-xs text-muted-foreground">
                  Odometer awal: {String(activeBooking.startOdometer)} km
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOdometerModal(false);
                setOdometerValue('');
                setPendingOdometerAction(null);
                setPendingOdometerValue(null);
              }}
            >
              Batal
            </Button>
            <Button 
              onClick={handleOdometerSubmit}
              disabled={!odometerValue.trim() || isRequestingGPS}
            >
              {isRequestingGPS ? 'Memproses...' : 'Lanjutkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GPS Permission Dialog */}
      <GPSPermissionDialog
        isOpen={showGPSPermissionDialog}
        onAllow={handleGPSPermissionAllow}
        onDeny={handleGPSPermissionDeny}
        isLoading={isRequestingGPS}
      />
    </div>
  );
}
