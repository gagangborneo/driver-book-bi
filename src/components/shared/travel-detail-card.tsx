'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapVisualization } from '@/components/shared/map-visualization';
import { GPSMap } from '@/components/shared/gps-map';
import { TripRatingDisplay } from '@/components/shared/trip-rating';
import { formatDate } from '@/lib/format';
import { api } from '@/lib/api';
import { 
  Car, 
  MapPin, 
  Flag, 
  Calendar, 
  Clock, 
  User, 
  Gauge,
  CheckCircle2,
  Circle,
  ArrowRight,
  Map as MapIcon,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TravelDetailCardProps {
  booking: Record<string, unknown>;
  showDriver?: boolean;
  token?: string;
}

export function TravelDetailCard({ booking, showDriver = true, token }: TravelDetailCardProps) {
  const [gpsWaypoints, setGpsWaypoints] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  useEffect(() => {
    // Load GPS waypoints if booking has started
    if (token && booking.id && ['DEPARTED', 'ARRIVED', 'RETURNING', 'COMPLETED'].includes(booking.status as string)) {
      const loadWaypoints = async () => {
        setIsLoadingGPS(true);
        try {
          const response = await api(`/gps?bookingId=${booking.id}`, {}, token);
          setGpsWaypoints(response.waypoints || []);
        } catch (error) {
          console.error('Error loading GPS waypoints:', error);
        } finally {
          setIsLoadingGPS(false);
        }
      };
      loadWaypoints();
    }
  }, [booking.id, booking.status, token]);

  const parseCoords = (coordsStr: string | null) => {
    if (!coordsStr) return null;
    try {
      const parsed = JSON.parse(coordsStr);
      return { lat: parsed.lat ?? parsed.latitude, lng: parsed.lng ?? parsed.longitude };
    } catch {
      return null;
    }
  };

  const pickupCoords = parseCoords(booking.pickupCoords as string | null);
  const destCoords = parseCoords(booking.destinationCoords as string | null);
  const currentCoords = parseCoords(booking.currentCoords as string | null);

  const pickupData = pickupCoords ? {
    ...pickupCoords,
    name: booking.pickupLocation as string
  } : null;

  const destData = destCoords ? {
    ...destCoords,
    name: booking.destination as string
  } : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Menunggu</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-500">Siap</Badge>;
      case 'DEPARTED':
        return <Badge className="bg-indigo-500">Berangkat</Badge>;
      case 'ARRIVED':
        return <Badge className="bg-purple-500">Tiba</Badge>;
      case 'RETURNING':
        return <Badge className="bg-orange-500">Kembali</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const journeySteps = [
    { 
      key: 'APPROVED', 
      label: 'Siap', 
      icon: CheckCircle2,
      timestamp: booking.startedAt as string | undefined,
      color: 'text-blue-500'
    },
    { 
      key: 'DEPARTED', 
      label: 'Berangkat', 
      icon: ArrowRight,
      timestamp: booking.departedAt as string | undefined,
      color: 'text-indigo-500'
    },
    { 
      key: 'ARRIVED', 
      label: 'Tiba', 
      icon: Flag,
      timestamp: booking.arrivedAt as string | undefined,
      color: 'text-purple-500'
    },
    { 
      key: 'RETURNING', 
      label: 'Kembali', 
      icon: ArrowRight,
      timestamp: booking.returningAt as string | undefined,
      color: 'text-orange-500'
    },
    { 
      key: 'COMPLETED', 
      label: 'Selesai', 
      icon: CheckCircle2,
      timestamp: booking.completedAt as string | undefined,
      color: 'text-green-500'
    },
  ];

  const getCurrentStepIndex = (status: string) => {
    const statusMap: Record<string, number> = {
      'PENDING': -1,
      'APPROVED': 0,
      'DEPARTED': 1,
      'ARRIVED': 2,
      'RETURNING': 3,
      'COMPLETED': 4,
      'CANCELLED': -1,
    };
    return statusMap[status] ?? -1;
  };

  const currentStepIndex = getCurrentStepIndex(booking.status as string);

  return (
    <Card className={cn(
      (booking.status as string) === 'CANCELLED' && 'opacity-60'
    )}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 pb-3 border-b">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                {showDriver ? (
                  <>
                    <p className="font-medium">
                      {booking.driver ? (booking.driver as Record<string, unknown>).name as string : 'Menunggu Driver'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.vehicle 
                        ? `${(booking.vehicle as Record<string, unknown>).brand as string} - ${(booking.vehicle as Record<string, unknown>).plateNumber as string}` 
                        : '-'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      {booking.employee ? (booking.employee as Record<string, unknown>).name as string : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.vehicle 
                        ? `${(booking.vehicle as Record<string, unknown>).brand as string}` 
                        : '-'}
                    </p>
                  </>
                )}
              </div>
            </div>
            {getStatusBadge(booking.status as string)}
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

        {/* Map Visualization */}
        {(pickupData || destData) && (booking.status as string) !== 'PENDING' && (booking.status as string) !== 'CANCELLED' && (
          <div className="p-4 pt-3 pb-3 bg-slate-50">
            <MapVisualization 
              pickup={pickupData}
              destination={destData}
              currentStatus={booking.status as string}
            />
          </div>
        )}

        {/* Journey Status Timeline */}
        {(booking.status as string) !== 'PENDING' && (booking.status as string) !== 'CANCELLED' && (
          <div className="p-4 pt-3 pb-3 border-b bg-white">
            <h4 className="text-sm font-semibold mb-3">Status Perjalanan</h4>
            <div className="space-y-3">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      isCompleted 
                        ? (isCurrent ? 'bg-primary' : 'bg-green-500') 
                        : 'bg-slate-200'
                    )}>
                      {isCompleted ? (
                        <Icon className="h-4 w-4 text-white" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm font-medium",
                          isCompleted ? (isCurrent ? 'text-primary' : 'text-slate-900') : 'text-slate-400'
                        )}>
                          {index + 1}. {step.label}
                        </p>
                        {step.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(step.timestamp).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        )}
                      </div>
                      
                      {isCurrent && (booking.status as string) !== 'COMPLETED' && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sedang dalam proses...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Location Details */}
        <div className="p-4 pt-3 pb-3 border-b space-y-2.5">
          <h4 className="text-sm font-semibold mb-2">Detail Lokasi</h4>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-xs text-muted-foreground">Penjemputan</p>
              <p className="text-slate-900">{booking.pickupLocation as string}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Flag className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-xs text-muted-foreground">Tujuan</p>
              <p className="text-slate-900">{booking.destination as string}</p>
            </div>
          </div>
        </div>

        {/* GPS Map Visualization */}
        {['DEPARTED', 'ARRIVED', 'RETURNING', 'COMPLETED'].includes(booking.status as string) && (
          <div className="p-4 pt-3 pb-3 border-b">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Rute Perjalanan GPS</h4>
              </div>
              {isLoadingGPS && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {!isLoadingGPS && gpsWaypoints.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">{gpsWaypoints.length} titik lokasi</span>
              )}
            </div>
            <GPSMap
              waypoints={gpsWaypoints.map((w: Record<string, unknown>) => ({
                id: w.id as string,
                latitude: w.latitude as number,
                longitude: w.longitude as number,
                accuracy: w.accuracy as number | undefined,
                timestamp: w.timestamp as string,
              }))}
              pickup={pickupData}
              destination={destData}
              currentLocation={currentCoords ? { latitude: currentCoords.lat, longitude: currentCoords.lng } : undefined}
              height="h-80"
            />
            {gpsWaypoints.length === 0 && !isLoadingGPS && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Belum ada data GPS yang tersimpan untuk perjalanan ini
              </div>
            )}
          </div>
        )}

        {/* Additional Details */}
        <div className="p-4 pt-3 space-y-2.5">
          <h4 className="text-sm font-semibold mb-2">Informasi Tambahan</h4>
          
          {/* Odometer */}
          {(Boolean(booking.startOdometer) || Boolean(booking.endOdometer)) && (
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Odometer:</span>
                <span className="font-medium">
                  {booking.startOdometer ? `${String(booking.startOdometer)} km` : '-'}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">
                  {booking.endOdometer ? `${String(booking.endOdometer)} km` : '-'}
                </span>
                {Boolean(booking.startOdometer) && Boolean(booking.endOdometer) && (
                  <span className="text-xs text-muted-foreground">
                    ({String(Number(booking.endOdometer) - Number(booking.startOdometer))} km)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {Boolean(booking.notes) && (
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">Catatan:</span>
                <p className="text-slate-900 mt-0.5">{booking.notes as string}</p>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {Boolean(booking.rejectionReason) && (
            <div className="p-2 bg-red-50 rounded text-sm">
              <p className="text-red-600 font-medium">Alasan Pembatalan:</p>
              <p className="text-red-800 mt-0.5">{booking.rejectionReason as string}</p>
            </div>
          )}
        </div>

        {/* Rating Display */}
        {Boolean(booking.rating) && (
          <div className="p-4 pt-0">
            <TripRatingDisplay 
              rating={booking.rating as number}
              comment={booking.ratingComment as string | null}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
